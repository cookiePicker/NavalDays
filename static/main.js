let isHost = location.search.includes("creator=1");
let peerConnections = {};
let dataChannels = {};
let localID = null;
let pos = { x: -0.5, y: -0.5 };

const socket = io();
const ROOM_ID = new URLSearchParams(location.search).get("id");
socket.emit("join", { room: ROOM_ID });

socket.on("peers", (peerIds) => {
  peerIds.forEach(createOffer);
});

socket.on("new-peer", (id) => {
  createOffer(id);
});

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

async function createPeer(id, isOfferer) {
  const pc = new RTCPeerConnection();
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
    if (e.candidate)
      socket.emit("signal", { to: id, signal: { candidate: e.candidate } });
  };

  if (isOfferer) {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("signal", { to: id, signal: offer });
  }

  return pc;
}

function setupDataChannel(dc, id) {
  dc.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "pos") {
      WebGLApp.setPosition(data.x, data.y);
    }
  };
}

// HOST управляет и отправляет координаты
document.addEventListener("keydown", (e) => {
  if (!isHost) return;
  if (e.key === "w") pos.y += 0.05;
  if (e.key === "s") pos.y -= 0.05;
  if (e.key === "a") pos.x -= 0.05;
  if (e.key === "d") pos.x += 0.05;

  WebGLApp.setPosition(pos.x, pos.y);

  const msg = JSON.stringify({ type: "pos", x: pos.x, y: pos.y });
  for (let id in dataChannels) {
    if (dataChannels[id].readyState === "open") {
      dataChannels[id].send(msg);
    }
  }
});
