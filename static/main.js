const socket = io(); // подключение к socket.io

let peerConnections = {};
let localStream;
const roomID = new URLSearchParams(window.location.search).get("id");

// Получаем локальное видео
navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
  localStream = stream;

  const video = document.createElement("video");
  video.srcObject = stream;
  video.autoplay = true;
  video.muted = true;
  video.style.border = "2px solid green";
  document.body.appendChild(video);

  socket.emit("join", { room: roomID });
});

// Когда другие участники уже в комнате
socket.on("peers", (peers) => {
  peers.forEach(peerId => {
    createPeerConnection(peerId, true);
  });
});

// Когда новый участник подключается
socket.on("new-peer", (peerId) => {
  createPeerConnection(peerId, false);
});

// Получение сигнала
socket.on("signal", async ({ from, signal }) => {
  const pc = peerConnections[from];
  if (!pc) return;

  if (signal.sdp) {
    await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
    if (signal.sdp.type === "offer") {
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("signal", { to: from, signal: { sdp: pc.localDescription } });
    }
  } else if (signal.candidate) {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
    } catch (e) {
      console.error("ICE error:", e);
    }
  }
});

// Создание и настройка PeerConnection
function createPeerConnection(peerId, isInitiator) {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  peerConnections[peerId] = pc;

  // Добавляем локальные медиа потоки
  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

  // ICE кандидаты
  pc.onicecandidate = ({ candidate }) => {
    if (candidate) {
      socket.emit("signal", { to: peerId, signal: { candidate } });
    }
  };

  // Появляется удалённый видеопоток
  pc.ontrack = (event) => {
    const remoteVideo = document.createElement("video");
    remoteVideo.srcObject = event.streams[0];
    remoteVideo.autoplay = true;
    remoteVideo.style.border = "2px solid red";
    document.body.appendChild(remoteVideo);
  };

  // Отправляем offer
  if (isInitiator) {
    pc.onnegotiationneeded = async () => {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("signal", { to: peerId, signal: { sdp: pc.localDescription } });
    };
  }
}
