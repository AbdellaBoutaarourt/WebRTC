// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Zorg ervoor dat je React-app toegang heeft tot de server
  },
});

io.on('connection', (socket) => {
  console.log('A user connected: ' + socket.id);

  // Luister naar signalen van peers
  socket.on('signal', (data) => {
    io.to(data.to).emit('signal', data);
  });

  socket.on('join-room', (room) => {
    socket.join(room);
    socket.to(room).emit('user-joined', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected: ' + socket.id);
  });
});

server.listen(5000, () => {
  console.log('Signaling server running on port 5000');
});
