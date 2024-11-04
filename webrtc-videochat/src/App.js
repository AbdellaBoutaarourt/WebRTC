import React, { useState } from 'react';
import RoomSelection from './components/RoomSelection';
import VideoChat from './components/VideoChat';

function App() {
  const [room, setRoom] = useState('');

  const joinRoom = (roomName) => {
    setRoom(roomName);
  };

  return (
    <div className="App">
      {room === '' ? (
        <RoomSelection joinRoom={joinRoom} />
      ) : (
        <VideoChat room={room} />
      )}
    </div>
  );
}

export default App;
