import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import VideoChat from './components/VideoChat';
import socket from './socket';

function App() {
  const [name, setName] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [userName, setUserName] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off("onlineUsers");
    };
  }, []);

  const handleJoin = () => {
    if (name) {
      setUserName(name);
      setIsJoined(true);
      socket.emit("setUsername", name);
      setUserId(socket.id);
    } else {
      alert('Please enter a name');
    }
  };

  const handleLogout = () => {
    socket.emit("logout");
    setUserName('');
    setUserId('');
    setIsJoined(false);
  };

  return (
    <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-red-600 min-h-screen flex items-center justify-center p-4">
      <Sidebar userName={userName} onLogout={handleLogout} onlineUsers={onlineUsers} userId={userId} />
      <div className="flex-1 p-8 ml-64">
        {!isJoined ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <h2 className="text-xl font-semibold">Enter your name to join the video chat</h2>
            <input
              type="text"
              placeholder="Enter your name"
              value={name || ''}
              onChange={(e) => setName(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg w-80"
            />
            <button
              onClick={handleJoin}
              className="bg-green-500 text-white p-3 rounded-lg w-80 hover:bg-green-600"
            >
              Join
            </button>
          </div>
        ) : (
          <VideoChat name={name} />
        )}
      </div>
    </div>
  );
}

export default App;
