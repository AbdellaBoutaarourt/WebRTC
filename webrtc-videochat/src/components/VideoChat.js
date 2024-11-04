import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import SimplePeer from 'simple-peer';

const socket = io('http://localhost:5000');

const VideoChat = ({ room }) => {
    const [me, setMe] = useState('');
    const [stream, setStream] = useState(null);
    const [callAccepted, setCallAccepted] = useState(false);
    const [caller, setCaller] = useState('');
    const [callerSignal, setCallerSignal] = useState(null);

    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
            setStream(stream);
            myVideo.current.srcObject = stream;
        });

        socket.emit('join-room', room);

        socket.on('user-joined', (id) => {
            setCaller(id);
        });

        socket.on('signal', (data) => {
            if (data.to === me) {
                setCallerSignal(data.signal);
            }
        });

        socket.on('connect', () => {
            setMe(socket.id);
        });
    }, [room, me]);

    const callUser = () => {
        const peer = new SimplePeer({ initiator: true, trickle: false, stream });

        peer.on('signal', (data) => {
            socket.emit('signal', { to: caller, signal: data });
        });

        peer.on('stream', (userStream) => {
            userVideo.current.srcObject = userStream;
        });

        connectionRef.current = peer;
    };

    const answerCall = () => {
        setCallAccepted(true);
        const peer = new SimplePeer({ initiator: false, trickle: false, stream });

        peer.on('signal', (data) => {
            socket.emit('signal', { to: caller, signal: data });
        });

        peer.signal(callerSignal);

        peer.on('stream', (userStream) => {
            userVideo.current.srcObject = userStream;
        });

        connectionRef.current = peer;
    };

    return (
        <div className="flex flex-col items-center justify-center gap-4 p-6">
            <h1 className="text-2xl font-bold mb-6">Room: {room}</h1>
            <div className="flex gap-4">
                <video playsInline muted ref={myVideo} autoPlay className="rounded-lg shadow-lg" />
                {callAccepted && <video playsInline ref={userVideo} autoPlay className="rounded-lg shadow-lg" />}
            </div>
            <div className="mt-4">
                {caller && !callAccepted ? (
                    <button onClick={answerCall} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        Answer Call
                    </button>
                ) : (
                    <button onClick={callUser} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Call User
                    </button>
                )}
            </div>
        </div>
    );
};

export default VideoChat;
