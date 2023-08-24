//roomHandlers.js
function createRoom(title, io, rooms) {
  const roomId = rooms.length + 1;
  const room = { id: roomId, title: title, users: [], chatLog: [] };
  rooms.push(room);
  io.emit("updateRoomList", rooms);
  return roomId;
}

function joinRoom(socket, roomId, rooms) {
  const room = rooms.find((r) => r.id === roomId);
  if (room) {
    socket.join(`room-${room.id}`);
    room.users.push(socket.id);
    socket.emit("chatLog", { roomId: room.id, chatLog: room.chatLog });
  }
}

module.exports = {
  createRoom,
  joinRoom,
};
