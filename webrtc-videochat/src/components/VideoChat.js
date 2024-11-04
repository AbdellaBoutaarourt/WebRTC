import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import SimplePeer from 'simple-peer';

const socket = io('http://localhost:5000');

const VideoChat = ({ room }) => {
    const [stream, setStream] = useState(null);
    const [callAccepted, setCallAccepted] = useState(false);
    const [caller, setCaller] = useState(null);
    const [users, setUsers] = useState([]);

    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((mediaStream) => {
                setStream(mediaStream);
                myVideo.current.srcObject = mediaStream;
                console.log("Stream initialized:", mediaStream);
                socket.emit('join-room', room);
            })
            .catch((err) => console.error("Error accessing media devices:", err));

        socket.on('existing-users', (existingUsers) => {
            console.log("Existing users in room:", existingUsers);
            setUsers(existingUsers);

            if (existingUsers.length > 1) {
                const otherUserId = existingUsers.find((id) => id !== socket.id);
                setCaller(otherUserId);
            }
        });

        socket.on('signal', ({ signal, from }) => {
            console.log("Received signal from:", from, signal);
            setCaller(from);
            if (signal) {
                answerCall(signal);
            } else {
                console.log("No incoming signal to answer.");
            }
        });

        return () => {
            socket.off('existing-users');
            socket.off('signal');
        };
    }, [room]);

    useEffect(() => {
        if (caller && stream && !callAccepted) {
            console.log("User Stream:", stream);
            console.log("Caller:", caller);
            console.log("Call Accepted:", callAccepted);
            callUser(caller);
        }
    }, [stream, caller, callAccepted]);

    const callUser = (userId) => {
        if (!userId) {
            console.log("No user ID provided for call.");
            return;
        }
        if (!stream) {
            console.log("No stream available for call.");
            return;
        }
        console.log("Calling user:", userId);
        const peer = new SimplePeer({ initiator: true, trickle: false, stream });

        peer.on('signal', (data) => {
            console.log("Sending signal to:", userId, data);
            socket.emit('signal', { to: userId, signal: data });
        });

        peer.on('stream', (userStream) => {
            console.log("Received user stream:", userStream);
            if (userStream.getVideoTracks().length > 0) {
                userVideo.current.srcObject = userStream;
            } else {
                console.log("Le stream reçu ne contient pas de piste vidéo.");
            }
        });


        connectionRef.current = peer;
    };

    const answerCall = (incomingSignal) => {
        if (!incomingSignal) {
            console.log("No incoming signal to answer.");
            return;
        }
        setCallAccepted(true);
        const peer = new SimplePeer({ initiator: false, trickle: false, stream });

        peer.on('signal', (data) => {
            console.log("Sending signal to:", caller, data);
            socket.emit('signal', { to: caller, signal: data });
        });

        console.log("Answering call with signal:", incomingSignal);
        peer.signal(incomingSignal);

        peer.on('stream', (userStream) => {
            console.log("Received user stream:", userStream);
            if (userStream.getVideoTracks().length > 0) {
                userVideo.current.srcObject = userStream;
            } else {
                console.log("Le stream reçu ne contient pas de piste vidéo.");
            }
        });


        connectionRef.current = peer;
    };

    return (
        <div className="flex flex-col items-center justify-center gap-4 p-6">
            <h1 className="text-2xl font-bold mb-6">Room: {room}</h1>
            <div className="flex gap-4">
                <video playsInline muted ref={myVideo} autoPlay className="rounded-lg shadow-lg" />
                {callAccepted ? (
                    <video playsInline ref={userVideo} autoPlay className="rounded-lg shadow-lg" />
                ) : null}
            </div>
            <div className="mt-4">
                <h2 className="text-xl font-semibold">Connected Users:</h2>
                <ul>
                    {users.map((user) => (
                        <li key={user} className="text-lg">{user}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default VideoChat;
