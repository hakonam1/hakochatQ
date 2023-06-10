const socket = io();

// チャットログの表示
const chatLogContainer = document.getElementById('chatLog');
function displayChatLog(chatLog) {
  chatLogContainer.innerHTML = '';

  chatLog.forEach((message) => {
    const messageElement = document.createElement('div');
    const timestamp = luxon.DateTime.fromFormat(message.timestamp, 'yyMMddHHmmss', { zone: 'Asia/Tokyo' });

    const formattedTimestamp = `${String(timestamp.hour).padStart(2, '0')}:${String(timestamp.minute).padStart(2, '0')}:${String(timestamp.second).padStart(2, '0')}`;

    messageElement.innerHTML = `
      <div class="message">
        <div class="message-content">${message.text}</div>
        <div class="message-timestamp">${formattedTimestamp}</div>
      </div>
    `;

    chatLogContainer.appendChild(messageElement);
  });
}


// メッセージ送信
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');

messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const message = messageInput.value.trim();
  if (message !== '') {
    socket.emit('message', message);
    messageInput.value = '';
  }
});

// Discord Webhookの設定
const webhookForm = document.getElementById('webhookForm');
const webhookInput = document.getElementById('webhookInput');
const webhookBtn = document.getElementById('webhookBtn');

webhookForm.addEventListener('submit', (e) => {
  e.preventDefault();
});

webhookBtn.addEventListener('click', () => {
  const webhookURL = webhookInput.value.trim();
  if (webhookURL !== '') {
    socket.emit('setWebhook', webhookURL);
    webhookInput.value = '';
  }
});

// 接続数の表示
const userCountElement = document.getElementById('userCount');

socket.on('userCount', (userCount) => {
  userCountElement.textContent = `現在の接続数: ${userCount}`;
});

// チャットログを受信したときの処理
socket.on('chatLog', (chatLog) => {
  displayChatLog(chatLog);
});
