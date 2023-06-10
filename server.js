// server.js
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const axios = require('axios');
const { DateTime } = require('luxon');
const path = require('path');

let chatLog = [];
let userCount = 0;
let webhookURL = '';

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  userCount++;
  io.emit('userCount', userCount);

  socket.emit('chatLog', chatLog);

  socket.on('message', (message) => {
    const timestamp = DateTime.now().setZone('Asia/Tokyo').toFormat('yyMMddHHmmss');
    const chatMessage = {
      text: message,
      timestamp: timestamp
    };
    chatLog.push(chatMessage);
    if (chatLog.length > 50) {
      chatLog.shift();
    }
    io.emit('chatLog', chatLog);

    if (webhookURL) {
      sendToDiscord(message);
    }
  });

  socket.on('setWebhook', (url) => {
    webhookURL = url;
  });

  socket.on('disconnect', () => {
    userCount--;
    io.emit('userCount', userCount);
  });
});

http.listen(3000, () => {
  console.log('Server is running on port 3000');
});

function sendToDiscord(message) {
  axios.post(webhookURL, {
    content: message
  })
    .then(() => {
      console.log('Message sent to Discord');
    })
    .catch((error) => {
      console.error('Error sending message to Discord:', error.message);
    });
}
