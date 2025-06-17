const socket = io();
const roomId = new URLSearchParams(location.search).get("id");
let pos = { x: -0.5, y: -0.5 };
let dataChannels = {};

socket.emit("join", { room: roomId });

socket.on("peers", (peerIds) => {
  peerIds.forEach((id) => createPeer(id, true));
});

socket.on("new-peer", (id) => {
  createPeer(id, true);
});

socket.on("signal", async ({ from, signal }) => {
  let pc = peerConnections[from];
  if (!pc) pc = await createPeer(from, false);
  if (signal.type) await pc.setRemoteDescription(signal);
  else if (signal.candidate) await pc.addIceCandidate(signal.candidate);
});

let peerConnections = {};
function createPeer(id, isOfferer) {
  const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
  peerConnections[id] = pc;

  if (isOfferer) {
    const dc = pc.createDataChannel("control");
    setupDC(dc, id);
    dataChannels[id] = dc;
  } else {
    pc.ondatachannel = (e) => {
      setupDC(e.channel, id);
      dataChannels[id] = e.channel;
    };
  }

  pc.onicecandidate = (e) => {
    if (e.candidate) socket.emit("signal", { to: id, signal: { candidate: e.candidate } });
  };

  if (isOfferer) {
    pc.createOffer().then(offer => {
      pc.setLocalDescription(offer);
      socket.emit("signal", { to: id, signal: offer });
    });
  }

  return pc;
}

function setupDC(dc, id) {
  dc.onopen = () => console.log("DataChannel opened:", id);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "w") pos.y += 0.05;
  if (e.key === "s") pos.y -= 0.05;
  if (e.key === "a") pos.x -= 0.05;
  if (e.key === "d") pos.x += 0.05;

  if (typeof WebGLApp !== "undefined") {
    WebGLApp.setPosition(pos.x, pos.y);
  }

  const msg = JSON.stringify({ type: "pos", x: pos.x, y: pos.y });
  for (let id in dataChannels) {
    if (dataChannels[id].readyState === "open") {
      dataChannels[id].send(msg);
    }
  }
});
