// server.js
require('dotenv').config();
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");
const { handleNewUser, handleUserDisconnect } = require("./utils/userHandlers");
const {
  handleNewMessage,
  handleUpvote,
  handleDownvote,
  updateTotalVotes,
} = require("./utils/messageHandlers");
const { createRoom, joinRoom } = require("./utils/roomHandlers");

// 初期化
let userCount = 0;
const rooms = [];

// 静的ファイルの提供
app.use(express.static(path.join(__dirname, "../public")));

// サーバーが接続されたときの処理
io.on("connect", (socket) => {
  handleNewUser(socket, io, rooms);

  socket.on("message", (message) => {
    handleNewMessage(message, socket, io, rooms);

    io.emit("updateRoomList", rooms); // メッセージ受信時にルームリストを更新
  });

  socket.on("createRoom", (title) => {
    createRoom(title, io, rooms);
    joinRoom(socket, rooms.length, rooms);
  });

  socket.on("joinRoom", (roomId) => {
    joinRoom(socket, roomId, rooms);
  });

  socket.on("upvote", (messageId) => {
    handleUpvote(socket, messageId, io, rooms);
  });

  socket.on("downvote", (messageId) => {
    handleDownvote(socket, messageId, io, rooms);
  });

  socket.on("disconnect", () => {
    handleUserDisconnect(socket, io, rooms);
  });
});

// サーバーを起動
http.listen(3000, () => {
  console.log("Server is running on port 3000");
});

module.exports = {
  userCount
}


// Hyperbeam function
const axios = require("axios");
let computer;

// Get a virtual computer object. If no object exists, create it.
app.get("/computer", async (req, res) => {
  if (computer) {
    res.send(computer);
    return;
  }
  const resp = await axios.post(
    "https://engine.hyperbeam.com/v0/vm",
    {},
    {
      headers: { Authorization: `Bearer ${process.env.HB_API_KEY}` },
    }
  );
  computer = resp.data;
  res.send(computer);
});
app.listen(8080, () => console.log("Server start at http://localhost:8080"));
