const express = require("express")
const http = require("http")
const app = express()
const server = http.createServer(app)
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
})

let onlineUsers = [];

io.on("connection", (socket) => {
  console.log("A user connected with id:", socket.id);


  socket.on("setUsername", (username) => {

    onlineUsers.push({ id: socket.id, username });
    console.log("Updated online users:", onlineUsers);

    io.emit("onlineUsers", onlineUsers);
  });

  socket.on("callUser", (data) => {
    io.to(data.userToCall).emit("callUser", { signal: data.signalData, from: data.from, name: data.name });
  });

  socket.on("startCall", (data) => {
    console.log("Starting call with:", data.selectedUser.username);
    io.to(data.selectedUser.id).emit("incomingCall", { from: socket.id });
  });

  socket.on("logout", () => {
    onlineUsers = onlineUsers.filter(user => user.id !== socket.id);
    console.log(`User with socket ID ${socket.id} logged out.`);

    io.emit("onlineUsers", onlineUsers);
  });

  socket.on("answerCall", (data) => {
    io.to(data.to).emit("callAccepted", data.signal);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    socket.broadcast.emit("callEnded", socket.id);

    onlineUsers = onlineUsers.filter((user) => user.id !== socket.id);

    io.emit("onlineUsers", onlineUsers);
  });

  socket.on("callEnded", (userId) => {
    console.log(`Call ended by user: ${userId}`);
    socket.broadcast.emit("callEnded", userId);
  });
});

server.listen(5000, () => console.log("server is running on port 5000"))
