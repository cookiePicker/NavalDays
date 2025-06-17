const socket = io();
const urlParams = new URLSearchParams(window.location.search);
const ROOM_ID = urlParams.get("id");
const isHost = urlParams.get("creator") === "1";

let pos = { x: -0.5, y: -0.5 };
let peerConnections = {};
let dataChannels = {};

// Присоединяемся к комнате
socket.emit("join", { room: ROOM_ID });

// Получаем список участников и создаём соединения
socket.on("peers", (peerIds) => {
  peerIds.forEach((id) => createPeer(id, true));
});

// Новый участник присоединился — создаём соединение
socket.on("new-peer", (id) => {
  createPeer(id, true);
});

// Обработка сигнала от другого клиента
socket.on("signal", async ({ from, signal }) => {
  let pc = peerConnections[from];
  if (!pc) pc = await createPeer(from, false);

  if (signal.type === "offer") {
    await pc.setRemoteDescription(signal);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit("signal", { to: from, signal: pc.localDescription });
  } else if (signal.type === "answer") {
    await pc.setRemoteDescription(signal);
  } else if (signal.candidate) {
    await pc.addIceCandidate(signal.candidate);
  }
});

// Создание WebRTC peer соединения
async function createPeer(id, isOfferer) {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  peerConnections[id] = pc;

  if (isOfferer) {
    const dc = pc.createDataChannel("control");
    setupDataChannel(dc, id);
    dataChannels[id] = dc;
  } else {
    pc.ondatachannel = (event) => {
      setupDataChannel(event.channel, id);
      dataChannels[id] = event.channel;
    };
  }

  pc.onicecandidate = (e) => {
    if (e.candidate) {
      socket.emit("signal", { to: id, signal: { candidate: e.candidate } });
    }
  };

  if (isOfferer) {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("signal", { to: id, signal: offer });
  }

  return pc;
}

// Обработка приёма и отправки данных
function setupDataChannel(dc, id) {
  dc.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "pos" && typeof WebGLApp !== "undefined") {
        WebGLApp.setPosition(data.x, data.y);
      }
    } catch (e) {
      console.error("Ошибка при обработке сообщения:", e);
    }
  };
}

// Обработка клавиш — только для хоста
document.addEventListener("keydown", (e) => {
  if (!isHost) return;

  switch (e.key) {
    case "w": pos.y += 0.05; break;
    case "s": pos.y -= 0.05; break;
    case "a": pos.x -= 0.05; break;
    case "d": pos.x += 0.05; break;
    default: return;
  }

  if (typeof WebGLApp !== "undefined") {
    WebGLApp.setPosition(pos.x, pos.y);
  }

  const message = JSON.stringify({ type: "pos", x: pos.x, y: pos.y });

  for (let id in dataChannels) {
    if (dataChannels[id].readyState === "open") {
      dataChannels[id].send(message);
    }
  }
});
