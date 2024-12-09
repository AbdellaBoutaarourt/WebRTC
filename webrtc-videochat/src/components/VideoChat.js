import React, { useEffect, useRef, useState } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PhoneIcon from '@mui/icons-material/Phone';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Peer from 'simple-peer';
import socket from '../socket';

function VideoChat({ name, remoteStream }) {
    const [me, setMe] = useState('');
    const [stream, setStream] = useState();
    const [receivingCall, setReceivingCall] = useState(false);
    const [caller, setCaller] = useState('');
    const [callerSignal, setCallerSignal] = useState();
    const [callAccepted, setCallAccepted] = useState(false);
    const [idToCall, setIdToCall] = useState('');
    const [callEnded, setCallEnded] = useState(false);
    const [callerName, setCallerName] = useState('');

    const myVideo = useRef(null);
    const userVideo = useRef(null);
    const connectionRef = useRef(null);

    const getMedia = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });
            setStream(mediaStream);
            if (myVideo.current) {
                myVideo.current.srcObject = mediaStream;
            }
        } catch (error) {
            console.error('Error accessing media devices:', error);
        }
    };

    useEffect(() => {
        getMedia();

        setMe(socket.id);

        socket.on('callUser', (data) => {
            setReceivingCall(true);
            setCaller(data.from);
            setCallerName(data.name);
            setCallerSignal(data.signal);
        });

        return () => {
            socket.off('callUser');
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
            if (connectionRef.current) {
                connectionRef.current.destroy();
                connectionRef.current = null;
            }
        };
    }, []);

    const callUser = (id) => {
        getMedia();

        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream: stream,
        });
        peer.on('signal', (data) => {
            socket.emit('callUser', {
                userToCall: id,
                signalData: data,
                from: me,
                name: name,
            });
        });

        peer.on('stream', (remoteStream) => {
            if (userVideo.current) {
                userVideo.current.srcObject = remoteStream;
            } else {
                console.error("userVideo reference is null!");
            }
        });
        socket.off('callAccepted');
        socket.on('callAccepted', (signal) => {
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
            stream: stream,
        });
        peer.on('signal', (data) => {
            socket.emit('answerCall', { signal: data, to: caller });
        });
        peer.on('stream', (remoteStream) => {
            if (userVideo.current) {
                userVideo.current.srcObject = null;
                userVideo.current.srcObject = remoteStream;
            } else {
                console.error("userVideo reference is null!");
            }
        });

        socket.off('callAccepted');
        peer.signal(callerSignal);

        connectionRef.current = peer;
    };

    const leaveCall = () => {
        if (connectionRef.current) {
            connectionRef.current.destroy();
            connectionRef.current = null;
        }

        setCallEnded(true);
        setCallAccepted(false);
        setIdToCall('');
        setReceivingCall(false);
        setCaller('');
        setCallerSignal(null);

        if (userVideo.current) {
            userVideo.current.srcObject = null;
        }
        socket.emit('callEnded', me);
    };

    return (
        <div>
            <div className="container mx-auto rounded-xl shadow-2xl bg-white max-w-4xl overflow-hidden">
                <div className="bg-gray-800 p-6">
                    <h1 className="text-center text-white text-3xl font-bold">Video Call</h1>
                </div>

                <div className="p-6">
                    <div className="video-container grid grid-cols-1 md:grid-cols-2 gap-6 justify-center items-center mb-8">
                        <div className="video relative">
                            {stream ? (
                                <video ref={myVideo} id="local-video" autoPlay playsInline className="w-full h-auto rounded-lg shadow-xl" />
                            ) : (
                                <div className="flex justify-center items-center h-48 bg-gray-200 rounded-lg">
                                    <span className="text-xl text-gray-500">Loading your video...</span>
                                </div>
                            )}
                            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                                You
                            </div>
                        </div>
                        <div className="video relative">
                            {callAccepted && !callEnded ? (
                                <>
                                    <video playsInline ref={userVideo} autoPlay className="w-full h-auto rounded-lg shadow-xl" />
                                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                                        Caller
                                    </div>
                                </>
                            ) : (
                                <div className="flex justify-center items-center h-48 bg-gray-200 rounded-lg">
                                    <span className="text-xl text-gray-500">Waiting for call...</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="myId space-y-4">
                        <div className="flex items-center space-x-2">
                            <TextField
                                id="my-id"
                                label="My ID"
                                value={me}
                                variant="outlined"
                                fullWidth
                                InputProps={{
                                    readOnly: true,
                                }}
                            />
                            <CopyToClipboard text={me}>
                                <Button variant="contained" color="primary" startIcon={<AssignmentIcon />}>
                                    Copy
                                </Button>
                            </CopyToClipboard>
                        </div>

                        <TextField
                            id="id-to-call"
                            label="ID to call"
                            value={idToCall}
                            onChange={(e) => setIdToCall(e.target.value)}
                            variant="outlined"
                            fullWidth
                        />

                        <div className="flex justify-center space-x-4">
                            {callAccepted && !callEnded ? (
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    onClick={leaveCall}
                                    startIcon={<PhoneIcon />}
                                    fullWidth
                                >
                                    End Call
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => callUser(idToCall)}
                                    startIcon={<PhoneIcon />}
                                    fullWidth
                                    disabled={!idToCall}
                                >
                                    Start Call
                                </Button>
                            )}
                        </div>

                        {receivingCall && !callAccepted && (
                            <div className="flex justify-center mt-4">
                                <Button
                                    variant="contained"
                                    color="error"
                                    onClick={answerCall}
                                    fullWidth
                                    className="max-w-xs"
                                >
                                    Answer Call from {callerName}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VideoChat;
