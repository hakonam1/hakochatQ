//messageHandlers.js
function generateMessageId() {
  const timestamp = Date.now();
  const randomString = generateRandomString(5);
  return `${timestamp}-${randomString}`;
}

function generateRandomString(length) {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  return result;
}



//新しいメッセージが受信されたときの処理
function handleNewMessage(message, socket, io, rooms) {
  console.log("Received new message:", message);
  const text = message.text;
  const timestamp = message.timestamp;
  const roomId = message.roomId;

  // URLを正規表現を使用して検出
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const messageWithLinks = text.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank">${url}</a>`;
  });

  if (text.length > 200) {
    socket.emit("error", "Message is limited to 200 characters.");
    return;
  }

  let room = rooms.find((r) => r.id === roomId);
  if (!room) {
    console.log("Room not found. Creating a new room...");
    room = { id: roomId, title: "", users: [], chatLog: [] };
    rooms.push(room);
    io.emit("updateRoomList", rooms);
  }

  const chatMessage = {
    id: generateMessageId(),
    messageNumber: room.chatLog.length + 1, // メッセージ番号を追加
    text: messageWithLinks, // ハイパーリンクに変換したテキストを使用
    timestamp: timestamp,
    upvotes: 0,
    downvotes: 0,
    isOwnMessage: false,
  };



  chatMessage.isOwnMessage = room.id === message.roomId;
  room.chatLog.push(chatMessage);

  if (room.chatLog.length > 10000) {
    room.chatLog.shift();
  }

  io.to(`room-${room.id}`).emit("chatLog", {
    roomId: room.id,
    chatLog: room.chatLog,
  })

  // 新しいメッセージがあるルームのインデックスを検索
  const roomIndex = rooms.findIndex((r) => r.id === roomId);
  
  if (roomIndex !== -1) {
    // ルームをリストから削除し、先頭に移動させる
    const [room] = rooms.splice(roomIndex, 1);
    rooms.unshift(room);
    
    io.emit("updateRoomList", rooms); // 全クライアントにルームリストの更新を送信
  }

  room.totalMessages = room.chatLog.length;

  console.log("Updated chatLog for room", room.id);;
}

function handleUpvote(socket, messageId, io, rooms) {
  console.log('handleUpvote called for message ID:', messageId); // デバッグログ

  const room = rooms.find((r) => r.users.includes(socket.id));
  if (room) {
    const message = room.chatLog.find((msg) => msg.id === messageId);
    if (message) {
      message.upvotes += 1;
      io.to(`room-${room.id}`).emit("updateMessage", message);

      // 合計値を更新してクライアントに送信
      updateTotalVotes(room.id, io, rooms);
    }
  }
}

function handleDownvote(socket, messageId, io, rooms) {
  console.log('handleDownvote called for message ID:', messageId); // デバッグログ

  const room = rooms.find((r) => r.users.includes(socket.id));
  if (room) {
    const message = room.chatLog.find((msg) => msg.id === messageId);
    if (message) {
      message.downvotes += 1;
      io.to(`room-${room.id}`).emit("updateMessage", message);

      // 合計値を更新してクライアントに送信
      updateTotalVotes(room.idm, io, rooms);
    }
  }
}

// クライアント側に合計値を送信
function updateTotalVotes(roomId, io, rooms) {
  const room = rooms.find((r) => r.id === roomId);
  if (room) {
    const { totalUpvotes, totalDownvotes } = calculateTotalVotes(room.chatLog);
    io.to(`room-${room.id}`).emit('updateTotalVotes', {
      totalUpvotes,
      totalDownvotes,
    });
    // デバッグ用のログを出力
    console.log(`Sent total upvotes: ${totalUpvotes}, total downvotes: ${totalDownvotes}`);
  }
}

// 関数: チャットメッセージのupvotesとdownvotesの合計を計算する
function calculateTotalVotes(chatLog) {
  let totalUpvotes = 0;
  let totalDownvotes = 0;

  chatLog.forEach((message) => {
    totalUpvotes += message.upvotes;
    totalDownvotes += message.downvotes;
  });

  return { totalUpvotes, totalDownvotes };
}


module.exports = {
  handleNewMessage,
  handleUpvote,
  handleDownvote,
  updateTotalVotes,
};
