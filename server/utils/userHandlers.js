//userHandlers.js
let userCount = 0;

//新しいユーザーが接続されたときの処理
function handleNewUser(socket, io, rooms) {
  userCount++;
  io.emit("userCount", userCount);
  socket.emit("updateRoomList", rooms);
}

//ユーザーが切断されたときの処理
function handleUserDisconnect(socket, io, rooms) {
  userCount--;
  io.emit("userCount", userCount);
  const room = rooms.find((r) => r.users.includes(socket.id));
  if (room) {
    room.users = room.users.filter((userId) => userId !== socket.id);
  }
}

module.exports = {
  handleNewUser,
  handleUserDisconnect,
};
