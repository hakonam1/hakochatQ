//script.js

console.log("script.js is running");
const socket = io();
const chatLogContainer = document.getElementById('chatLog');
const userCountElement = document.getElementById('userCount');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const createRoomButton = document.getElementById('createRoomButton');
const roomInput = document.getElementById('roomInput');
const cancelButton = document.getElementById('cancelButton');
const roomDialog = document.getElementById('roomDialog');
const roomList = document.getElementById('roomList');

let currentRoomId = null;

function escapeHTML(str) {
  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return str.replace(/[&<>"']/g, (char) => escapeMap[char]);
}

function createMessageElement(message) {
  const messageElement = document.createElement('div');
  const timestamp = new Date(message.timestamp);
  const formattedTimestamp = timestamp.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  // Create message content element
  const messageContent = document.createElement('div');
  messageContent.classList.add('message-content');
  messageContent.textContent = escapeHTML(message.text);

  // Create metadata container
  const metadataContainer = document.createElement('div');
  metadataContainer.classList.add('metadata-container');

  // Create message timestamp element
  const messageTimestamp = document.createElement('div');
  messageTimestamp.classList.add('message-timestamp');
  messageTimestamp.textContent = formattedTimestamp;

  // Create vote container
  const voteContainer = document.createElement('div');
  voteContainer.classList.add('vote-container');

  const upvoteButton = document.createElement('button');
  upvoteButton.classList.add('upvote-button', 'vote-button');
  upvoteButton.textContent = '↑';
  upvoteButton.setAttribute('data-message-id', message.id);

  const upvoteCount = document.createElement('span');
  upvoteCount.classList.add('upvote-count');
  upvoteCount.textContent = `${message.upvotes}`;

  const downvoteButton = document.createElement('button');
  downvoteButton.classList.add('downvote-button', 'vote-button');
  downvoteButton.textContent = '↓';
  downvoteButton.setAttribute('data-message-id', message.id);

  const downvoteCount = document.createElement('span');
  downvoteCount.classList.add('downvote-count');
  downvoteCount.textContent = ` ${message.downvotes}`;

  voteContainer.appendChild(upvoteButton);
  voteContainer.appendChild(upvoteCount);
  voteContainer.appendChild(downvoteButton);
  voteContainer.appendChild(downvoteCount);

  // Append elements to the appropriate containers
  metadataContainer.appendChild(messageTimestamp);
  metadataContainer.appendChild(voteContainer);

  messageElement.appendChild(messageContent);
  messageElement.appendChild(metadataContainer);

  messageElement.classList.add('message');
  if (message.isOwnMessage) {
    messageElement.classList.add('own-message')
  }

  return messageElement;
}


function displayChatLog(chatLog) {
  chatLogContainer.innerHTML = '';
  chatLog.forEach((message) => {
    addMessageToChatLog(message);
  });
  chatLogContainer.scrollTop = chatLogContainer.scrollHeight;
}

function addMessageToChatLog(message) {
  chatLogContainer.appendChild(createMessageElement(message));
  chatLogContainer.scrollTop = chatLogContainer.scrollHeight;
}

function sendMessage(e) {
  e.preventDefault();
  const message = messageInput.value.trim();
  if (message !== '' && currentRoomId !== null) {
    const timestamp = new Date().toISOString();
    socket.emit('message', { text: message, timestamp: timestamp, roomId: currentRoomId });
    messageInput.value = '';
  }
}

messageForm.addEventListener('submit', sendMessage);

messageForm.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === 'Return') && (e.metaKey || e.ctrlKey)) {
    sendMessage(e);
  }
});

createRoomButton.addEventListener('click', () => {
  roomDialog.style.display = 'block';
});

roomDialog.addEventListener('submit', (e) => {
  e.preventDefault();
  const roomTitle = roomInput.value.trim();
  if (roomTitle !== '') {
    socket.emit('createRoom', roomTitle);
    roomDialog.style.display = 'none';
    roomInput.value = '';
  }
});

cancelButton.addEventListener('click', () => {
  roomDialog.style.display = 'none';
});

socket.on('connect', () => {
  console.log('Connected to server.');
});

socket.on('userCount', (userCount) => {
  userCountElement.textContent = `user count: ${userCount}`;
  console.log("usercountが更新された")
});

socket.on('message', (message) => {
  sendNotification(message.text);
  console.log("message受け取った")
  if (message.roomId === currentRoomId) {
    addMessageToChatLog(message);
    console.log('Sending notification for message:', message.text); // デバッグログ
  }
});

socket.on('chatLog', (data) => {
  console.log("chatlogが反映された")
  if (data.roomId === currentRoomId) {
    displayChatLog(data.chatLog);
  }
});

socket.on('updateRoomList', (rooms) => {
  updateRoomList(rooms);
});

// 合計値の更新を受け取るイベントをハンドリングする
socket.on('updateTotalVotes', (totalVotes) => {
  console.log('Received updateTotalVotes event:', totalVotes); // デバッグログ

  // upvote-countとdownvote-countの要素を取得
  const upvoteCountElement = document.getElementById('upvote-count');
  const downvoteCountElement = document.getElementById('downvote-count');

  if (upvoteCountElement && downvoteCountElement) {
    // 受信した合計カウントを表示
    upvoteCountElement.textContent = `Upvotes: ${totalVotes.totalUpvotes}`;
    downvoteCountElement.textContent = `Downvotes: ${totalVotes.totalDownvotes}`;
  }
});


function updateRoomList(rooms) {
  roomList.innerHTML = '';
  rooms.forEach((room) => {
    const roomItem = document.createElement('li');
    const roomLink = document.createElement('a');
    roomLink.href = '#';
    roomLink.textContent = room.title;
    roomLink.setAttribute('data-room-id', room.id);
    roomLink.addEventListener('click', () => {
      joinRoom(room.id);
    });
    roomItem.appendChild(roomLink);
    roomList.appendChild(roomItem);
  });
}

function joinRoom(roomId) {
  socket.emit('joinRoom', roomId);
  currentRoomId = roomId;
  const roomLinks = roomList.querySelectorAll('a');
  roomLinks.forEach((link) => {
    link.classList.remove('active');
    if (link.getAttribute('data-room-id') === String(roomId)) {
      link.classList.add('active');
    }
  });
}

function sendUpvote(messageId) {
  socket.emit('upvote', messageId);
  console.log('Sent upvote event for message ID:', messageId); // デバッグログ
  updateVoteCountDisplay(); // 投票数表示を更新する関数を呼び出す
}

// Downvoteを送信
function sendDownvote(messageId) {
  socket.emit('downvote', messageId);
  console.log('Sent downvote event for message ID:', messageId); // デバッグログ
  updateVoteCountDisplay(); // 投票数表示を更新する関数を呼び出す
}

// 投票ボタンのクリックイベントリスナーを追加
chatLogContainer.addEventListener('click', (e) => {
  const target = e.target;
  if (target.classList.contains('upvote-button')) {
    const messageId = target.getAttribute('data-message-id');
    sendUpvote(messageId);
  } else if (target.classList.contains('downvote-button')) {
    const messageId = target.getAttribute('data-message-id');
    sendDownvote(messageId);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  Push.Permission.request();
});
