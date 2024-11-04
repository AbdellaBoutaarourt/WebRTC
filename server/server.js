const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  }
});

const usersInRooms = {};

io.on('connection', (socket) => {
  console.log('A user connected: ' + socket.id);

  socket.on('join-room', (room) => {
    if (usersInRooms[room] && usersInRooms[room].includes(socket.id)) {
      console.log(`User ${socket.id} is already in room: ${room}`);
      return;
    }

    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);

    if (!usersInRooms[room]) {
      usersInRooms[room] = [];
    }
    usersInRooms[room].push(socket.id);

    io.in(room).emit('existing-users', usersInRooms[room]);

    console.log(`Users in room ${room}:`, usersInRooms[room]);
  });

  socket.on('signal', (data) => {
    io.to(data.to).emit('signal', {
      signal: data.signal,
      to: data.to,
      from: socket.id
    });
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected: ' + socket.id);

    for (const room in usersInRooms) {
      if (usersInRooms[room]) {
        usersInRooms[room] = usersInRooms[room].filter(user => user !== socket.id);
        socket.to(room).emit('existing-users', usersInRooms[room]);
      }
    }
  });
});

app.get('/', (req, res) => {
  res.send('backend');
});

server.listen(5000, () => {
  console.log("SERVER RUNNING");
});
