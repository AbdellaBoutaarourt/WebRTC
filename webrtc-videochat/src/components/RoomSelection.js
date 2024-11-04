import React, { useState } from 'react';

const RoomSelection = ({ joinRoom }) => {
    const [room, setRoom] = useState('');

    const handleJoinRoom = () => {
        if (room !== '') {
            joinRoom(room);
        }
    };


    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <h1 className="text-4xl font-bold mb-6">Join a Video Chat Room</h1>
            <div className="flex flex-col gap-4">
                <input
                    type="text"
                    placeholder="Enter room name"
                    className="p-2 border border-gray-300 rounded-lg shadow-sm"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                />
                <button
                    onClick={handleJoinRoom}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Join Room
                </button>
            </div>
        </div>
    );
};

export default RoomSelection;
