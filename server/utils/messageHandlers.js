//messageHandlers.js
function generateMessageId() {
  const timestamp = Date.now();
  const randomString = generateRandomString(5);
  return `${timestamp}-${randomString}`;
}

function generateRandomString(length) {
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
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
    if (isSpotifyURL(url)) {
      // SpotifyのURLの場合、特定の処理を行う
      return generateSpotifyEmbed(url);
    } else if (isImageURL(url)) {
      // 画像URLの場合、モーダルを表示するためのリンクを生成
      return `<a href="#" class="image-link" data-image-url="${url}">${url}</a>`;
    } else {
      // 画像以外のURLの場合、通常のハイパーリンクを生成
      return `<a href="${url}" target="_blank">${url}</a>`;
    }
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

  room.lastMessageTimestamp = timestamp; // ルームの最後のメッセージのタイムスタンプを更新

  io.to(`room-${room.id}`).emit("chatLog", {
    roomId: room.id,
    chatLog: room.chatLog,
  });

  // 新しいメッセージがあるルームのインデックスを検索
  const roomIndex = rooms.findIndex((r) => r.id === roomId);

  if (roomIndex !== -1) {
    // ルームをリストから削除し、先頭に移動させる
    const [room] = rooms.splice(roomIndex, 1);
    rooms.unshift(room);

    io.emit("updateRoomList", rooms); // 全クライアントにルームリストの更新を送信
  }

  room.totalMessages = room.chatLog.length;

  console.log("Updated chatLog for room", room.id);
}

function handleUpvote(socket, messageId, io, rooms) {
  console.log("handleUpvote called for message ID:", messageId); // デバッグログ

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
  console.log("handleDownvote called for message ID:", messageId); // デバッグログ

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
    io.to(`room-${room.id}`).emit("updateTotalVotes", {
      totalUpvotes,
      totalDownvotes,
    });
    // デバッグ用のログを出力
    console.log(
      `Sent total upvotes: ${totalUpvotes}, total downvotes: ${totalDownvotes}`
    );
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

// 画像URLかどうかを判定する関数
function isImageURL(url) {
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  const lowercasedURL = url.toLowerCase();
  return imageExtensions.some((extension) => lowercasedURL.endsWith(extension));
}

// URLがSpotifyのURLかどうかを判定する関数
function isSpotifyURL(url) {
  const spotifyUrlRegex =
    /^https:\/\/open\.spotify\.com\/(track|album|playlist|artist)\/[a-zA-Z0-9?=]+$/;
  return spotifyUrlRegex.test(url);
}

function generateSpotifyEmbed(url) {
  // Spotify URLからURIを抽出
  const uriMatch = url.match(/https:\/\/open.spotify.com\/(track|album|playlist|artist)\/(\w+)/);

  if (uriMatch) {
    const type = uriMatch[1]; // URIのタイプ (track, album, playlist, artist)
    const id = uriMatch[2]; // Spotify IDを取得

    // Spotify埋め込みプレーヤーの設定
    const embedOptions = {
      uri: `${type}/${id}`,
      width: '80%', // プレーヤーの幅を調整
      height: '80', // プレーヤーの高さを調整
      theme: 'black', // テーマ（'black'または'white'）
      view: 'list', // ビューモード（'coverart'、'list'、'compact'など）
      auto_play: true, // 自動再生
      hide_cover: false, // アルバムカバーを表示
      show_tracklist: true, // トラックリストを表示
      show_playlist_tracks: true, // プレイリスト内の曲のトラックリストを表示
      start_track: 0, // 再生を開始するトラックのインデックス
      user: '', // ユーザーのSpotify ID
      callback: (state) => {
        // プレーヤーのイベントに対するコールバック関数
        if (!state.paused) {
          console.log('再生中');
        } else {
          console.log('一時停止中');
        }
      }
    };

    // Spotify埋め込みプレーヤーのHTMLコードを生成
    const embedCode = `
      <iframe 
        src="https://open.spotify.com/embed/${embedOptions.uri}"
        width="${embedOptions.width}" 
        height="${embedOptions.height}" 
        frameborder="0" 
        allowtransparency="true" 
        allow="encrypted-media"
        theme="${embedOptions.theme}"
        view="${embedOptions.view}"
        auto_play="${embedOptions.auto_play ? 'true' : 'false'}"
        hide_cover="${embedOptions.hide_cover ? 'true' : 'false'}"
        show_tracklist="${embedOptions.show_tracklist ? 'true' : 'false'}"
        show_playlist_tracks="${embedOptions.show_playlist_tracks ? 'true' : 'false'}"
        start_track="${embedOptions.start_track}"
        user="${embedOptions.user}">
      </iframe>
    `;

    return embedCode;
  } else {
    // 正しいSpotify URLが提供されていない場合はエラーメッセージを返す
    return "Invalid Spotify URL";
  }
}



module.exports = {
  handleNewMessage,
  handleUpvote,
  handleDownvote,
  updateTotalVotes,
};
