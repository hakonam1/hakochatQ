//script.js
console.log("script.js is running");
const socket = io();
const chatLogContainer = document.getElementById("chatLog");
const userCountElement = document.getElementById("userCount");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const createRoomButton = document.getElementById("createRoomButton");
const roomInput = document.getElementById("roomInput");
const cancelButton = document.getElementById("cancelButton");
const roomDialog = document.getElementById("roomDialog");
const roomList = document.getElementById("roomList");

let currentRoomId = null;

function escapeHTML(str) {
  const escapeMap = {
    // "&": "&amp;",
    // "<": "&lt;",
    // ">": "&gt;",
    // '"': "&quot;",
    // "'": "&#39;",
  };
  // return str.replace(/[&<>"']/g, (char) => escapeMap[char]);
  return str;
}

function createMessageElement(message) {
  const messageElement = document.createElement("div");
  const timestamp = new Date(message.timestamp);
  const formattedTimestamp = timestamp.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // メッセージ番号を表示するための要素を作成
  const messageNumber = document.createElement("div");
  messageNumber.classList.add("message-number");
  messageNumber.textContent = `${message.messageNumber}`;

  // Create message content element
  const messageContent = document.createElement("div");
  messageContent.classList.add("message-content");
  messageContent.innerHTML = escapeHTML(message.text);

  // Create metadata container
  const metadataContainer = document.createElement("div");
  metadataContainer.classList.add("metadata-container");

  // Create message timestamp element
  const messageTimestamp = document.createElement("div");
  messageTimestamp.classList.add("message-timestamp");
  messageTimestamp.textContent = formattedTimestamp;

  // Create vote container
  const voteContainer = document.createElement("div");
  voteContainer.classList.add("vote-container");

  const upvoteButton = document.createElement("button");
  upvoteButton.classList.add("upvote-button", "vote-button");
  upvoteButton.textContent = "↑";
  upvoteButton.setAttribute("data-message-id", message.id);

  const upvoteCount = document.createElement("span");
  upvoteCount.classList.add("upvote-count");
  upvoteCount.textContent = `${message.upvotes}`;

  const downvoteButton = document.createElement("button");
  downvoteButton.classList.add("downvote-button", "vote-button");
  downvoteButton.textContent = "↓";
  downvoteButton.setAttribute("data-message-id", message.id);

  const downvoteCount = document.createElement("span");
  downvoteCount.classList.add("downvote-count");
  downvoteCount.textContent = ` ${message.downvotes}`;

  voteContainer.appendChild(upvoteButton);
  voteContainer.appendChild(upvoteCount);
  voteContainer.appendChild(downvoteButton);
  voteContainer.appendChild(downvoteCount);

  // Append elements to the appropriate containers
  metadataContainer.appendChild(messageNumber); // メッセージ番号を追加
  metadataContainer.appendChild(messageTimestamp);
  metadataContainer.appendChild(voteContainer);

  messageElement.appendChild(messageContent);
  messageElement.appendChild(metadataContainer);

  messageElement.classList.add("message");
  if (message.isOwnMessage) {
    messageElement.classList.add("own-message");
  }

  // upvoteとdownvoteの差に応じてメッセージ要素にクラスを追加
  const voteMargin = message.upvotes - message.downvotes;

  if (voteMargin >= -9 && voteMargin <= -5) {
    messageElement.classList.add("voteMargin-1");
  } else if (voteMargin >= -14 && voteMargin <= -10) {
    messageElement.classList.add("voteMargin-2");
  } else if (voteMargin <= -15) {
    messageElement.classList.add("voteMargin-3");
  } else if (voteMargin >= 5 && voteMargin <= 9) {
    messageElement.classList.add("voteMargin1");
  } else if (voteMargin >= 10 && voteMargin <= 14) {
    messageElement.classList.add("voteMargin2");
  } else if (voteMargin >= 15) {
    messageElement.classList.add("voteMargin3");
  }

  return messageElement;
}

function displayChatLog(chatLog) {
  chatLogContainer.innerHTML = "";
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
  if (message !== "" && currentRoomId !== null) {
    const timestamp = new Date().toISOString();
    socket.emit("message", {
      text: message,
      timestamp: timestamp,
      roomId: currentRoomId,
    });
    messageInput.value = "";
  }
}

messageForm.addEventListener("submit", sendMessage);

messageForm.addEventListener("keydown", (e) => {
  if ((e.key === "Enter" || e.key === "Return") && (e.metaKey || e.ctrlKey)) {
    sendMessage(e);
  }
});

createRoomButton.addEventListener("click", () => {
  roomDialog.style.display = "block";
});

roomDialog.addEventListener("submit", (e) => {
  e.preventDefault();
  const roomTitle = roomInput.value.trim().substring(0, 20);
  if (roomTitle !== "") {
    socket.emit("createRoom", roomTitle);
    roomDialog.style.display = "none";
    roomInput.value = "";
  }
});

cancelButton.addEventListener("click", () => {
  roomDialog.style.display = "none";
});

socket.on("connect", () => {
  console.log("Connected to server.");
});

socket.on("userCount", (userCount) => {
  userCountElement.textContent = `Connecting: ${userCount}`;
  console.log("usercountが更新された");
});

socket.on("message", (message) => {
  sendNotification(message.text);
  console.log("message受け取った");
  if (message.roomId === currentRoomId) {
    addMessageToChatLog(message);
    console.log("Sending notification for message:", message.text); // デバッグログ
  }
});

socket.on("chatLog", (data) => {
  console.log("chatlogが反映された");
  if (data.roomId === currentRoomId) {
    displayChatLog(data.chatLog);
  }
});

socket.on("updateRoomList", (rooms) => {
  updateRoomList(rooms);
});

// 合計値の更新を受け取るイベントをハンドリングする
socket.on("updateTotalVotes", (totalVotes) => {
  console.log("Received updateTotalVotes event:", totalVotes); // デバッグログ

  // upvote-countとdownvote-countの要素を取得
  const upvoteCountElement = document.getElementById("upvote-count");
  const downvoteCountElement = document.getElementById("downvote-count");

  if (upvoteCountElement && downvoteCountElement) {
    // 受信した合計カウントを表示
    upvoteCountElement.textContent = `Upvotes: ${totalVotes.totalUpvotes}`;
    downvoteCountElement.textContent = `Downvotes: ${totalVotes.totalDownvotes}`;
  }
});

function updateRoomList(rooms) {
  roomList.innerHTML = "";
  rooms.forEach((room) => {
    const roomItem = document.createElement("li");
    const roomLink = document.createElement("a");
    roomLink.href = `#${room.id}`;
    roomLink.textContent = `${room.title} (${room.chatLog.length})`;
    roomLink.setAttribute("data-room-id", room.id);
    roomLink.addEventListener("click", () => {
      joinRoom(room.id);
    });
    roomItem.appendChild(roomLink);
    roomList.appendChild(roomItem);
  });
}

function joinRoom(roomId) {
  socket.emit("joinRoom", roomId);
  currentRoomId = roomId;
  const roomLinks = roomList.querySelectorAll("a");
  roomLinks.forEach((link) => {
    link.classList.remove("active");
    if (link.getAttribute("data-room-id") === String(roomId)) {
      link.classList.add("active");
      link.style.color = "#3498db";
    } else {
      link.style.color = "white";
    }
  });
}

// 新しい関数: 投票を送信する
function sendVote(messageId, voteType) {
  socket.emit(voteType, messageId);
  console.log(`Sent ${voteType} event for message ID:`, messageId); // デバッグログ
  updateVoteCountDisplay(); // 投票数表示を更新する関数を呼び出す
}

// 投票ボタンのクリックイベントリスナーを追加
chatLogContainer.addEventListener("click", (e) => {
  const target = e.target;
  if (target.classList.contains("upvote-button")) {
    const messageId = target.getAttribute("data-message-id");
    sendVote(messageId, "upvote"); // 新しい関数を呼び出して投票を送信
  } else if (target.classList.contains("downvote-button")) {
    const messageId = target.getAttribute("data-message-id");
    sendVote(messageId, "downvote"); // 新しい関数を呼び出して投票を送信
  }
});

document.addEventListener("DOMContentLoaded", () => {
  Push.Permission.request();
});

const splitter = document.getElementById("splitter");
const threadListContainer = document.querySelector(".thread-list-container");
const chatContainer = document.querySelector(".chat-container");

let isDragging = false;
let startX = 0;
let startWidth = 0;

splitter.addEventListener("mousedown", (e) => {
  isDragging = true;
  startX = e.pageX;
  startWidth = threadListContainer.offsetWidth;
});

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;

  const offset = e.pageX - startX;
  const newWidth = startWidth + offset;

  threadListContainer.style.width = newWidth + "px";
  chatContainer.style.width = `calc(100% - ${newWidth}px)`;
});

document.addEventListener("mouseup", () => {
  isDragging = false;
});
