// server.js
const express = require('express');
const http = require('http');
const { send } = require('process');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
  },
});

io.on('connection', (socket) => {
  console.log('A user connected: ' + socket.id);

  socket.on('signal', (data) => {
    io.to(data.to).emit('signal', data);
  });

  socket.on('join-room', (room) => {
    socket.join(room);
    socket.to(room).emit(`user-room: ${room}`, socket.id);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected: ' + socket.id);
  });
});

app.get('/', (req, res) => {
  res.send('backend');
});
server.listen(5000, () => {
  console.log("SERVER RUNNING");
})
