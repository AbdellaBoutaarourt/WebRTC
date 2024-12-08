// VideoChat.js
import Button from '@mui/material/Button';
import IconButton from "@mui/material/IconButton"
import TextField from "@mui/material/TextField"
import AssignmentIcon from "@mui/icons-material/Assignment"
import PhoneIcon from "@mui/icons-material/Phone"
import React, { useEffect, useRef, useState } from "react"
import { CopyToClipboard } from "react-copy-to-clipboard"
import Peer from "simple-peer"
import io from "socket.io-client"

const socket = io.connect('http://localhost:5000');

function VideoChat() {
    const [me, setMe] = useState("");
    const [stream, setStream] = useState();
    const [receivingCall, setReceivingCall] = useState(false);
    const [caller, setCaller] = useState("");
    const [callerSignal, setCallerSignal] = useState();
    const [callAccepted, setCallAccepted] = useState(false);
    const [idToCall, setIdToCall] = useState("");
    const [callEnded, setCallEnded] = useState(false);
    const [name, setName] = useState("");
    const [callerName, setCallerName] = useState("");

    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
            setStream(stream);
            if (myVideo.current) {
                myVideo.current.srcObject = stream;
            }
        });

        socket.on("me", (id) => {
            setMe(id);
        });

        socket.on("callUser", (data) => {
            setReceivingCall(true);
            setCaller(data.from);
            setCallerName(data.name);
            setCallerSignal(data.signal);
        });
    }, []);

    const callUser = (id) => {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream: stream
        });
        peer.on("signal", (data) => {
            socket.emit("callUser", {
                userToCall: id,
                signalData: data,
                from: me,
                name: name
            });
        });
        peer.on("stream", (stream) => {
            userVideo.current.srcObject = stream;
        });
        socket.on("callAccepted", (signal) => {
            setCallAccepted(true);
            peer.signal(signal);
        });

        connectionRef.current = peer;
    };

    const answerCall = () => {
        setCallAccepted(true);
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream: stream
        });
        peer.on("signal", (data) => {
            socket.emit("answerCall", { signal: data, to: caller });
        });
        peer.on("stream", (stream) => {
            userVideo.current.srcObject = stream;
        });

        peer.signal(callerSignal);
        connectionRef.current = peer;
    };

    const leaveCall = () => {
        setCallEnded(true);
        setCallAccepted(false);
        setIdToCall("");
        setReceivingCall(false);
        setCaller("");
        setCallerSignal(null);

        if (userVideo.current) {
            userVideo.current.srcObject = null;
        }

        if (myVideo.current) {
            myVideo.current.srcObject = null;
        }

        if (connectionRef.current) {
            connectionRef.current.destroy();
            connectionRef.current = null;
        }

        socket.emit("callEnded", me);

        window.location.reload();
    };

    useEffect(() => {
        socket.on("callEnded", (callerId) => {
            if (callerId !== me) {
                window.location.reload();
            }
        });

        return () => {
            socket.off("callEnded");
        };
    }, [me]);

    return (
        <>
            <h1 className="text-center text-white text-3xl mb-4">Call</h1>
            <div className="container mx-auto p-4 rounded-lg shadow-md">
                <div className="video-container flex flex-col md:flex-row justify-center items-center">
                    <div className="video mb-4 md:mr-4">
                        {stream && (
                            <video ref={myVideo} autoPlay playsInline className="w-64 h-auto rounded-lg shadow-lg" />
                        )}
                    </div>
                    <div className="video mb-4">
                        {callAccepted && !callEnded ? (
                            <video playsInline ref={userVideo} autoPlay className="w-64 h-auto rounded-lg shadow-lg" />
                        ) : null}
                    </div>
                </div>
                <div className="myId text-center">
                    <TextField
                        id="filled-basic"
                        label="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mb-4 w-full"
                    />
                    <CopyToClipboard text={me}>
                        <Button variant="contained" color="primary" startIcon={<AssignmentIcon fontSize="large" />} className="mb-4">
                            Copy ID
                        </Button>
                    </CopyToClipboard>

                    <TextField
                        id="filled-basic"
                        label="ID to call"
                        value={idToCall}
                        onChange={(e) => setIdToCall(e.target.value)}
                        className="mb-4 w-full"
                    />
                    <div className="call-button flex justify-center items-center">
                        {callAccepted && !callEnded ? (
                            <Button variant="contained" color="secondary" onClick={leaveCall} className="mr-4">
                                End Call
                            </Button>
                        ) : (
                            <IconButton color="primary" aria-label="call" onClick={() => callUser(idToCall)} className="mr-4">
                                <PhoneIcon fontSize="large" />
                            </IconButton>
                        )}
                        <span className="text-black">{idToCall}</span>
                    </div>
                </div>
                {receivingCall && !callAccepted ? (
                    <div className="caller text-center mt-4">
                        <h1 className="text-black text-xl">{callerName} is calling...</h1>
                        <Button variant="contained" color="primary" onClick={answerCall} className="mt-2">
                            Answer
                        </Button>
                    </div>
                ) : null}
            </div>
        </>
    );
}

export default VideoChat;
