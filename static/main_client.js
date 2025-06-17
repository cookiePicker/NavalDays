const socket = io();
const roomId = new URLSearchParams(location.search).get("id");
let peerConnections = {};

socket.emit("join", { room: roomId });

socket.on("peers", (peerIds) => {
  peerIds.forEach((id) => createPeer(id, true));
});

socket.on("new-peer", (id) => {
  createPeer(id, false);
});

socket.on("signal", async ({ from, signal }) => {
  let pc = peerConnections[from];
  if (!pc) pc = await createPeer(from, false);
  if (signal.type) await pc.setRemoteDescription(signal);
  else if (signal.candidate) await pc.addIceCandidate(signal.candidate);
});

function createPeer(id, isOfferer) {
  const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
  peerConnections[id] = pc;

  if (!isOfferer) {
    pc.ondatachannel = (e) => {
      e.channel.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "pos" && typeof WebGLApp !== "undefined") {
            WebGLApp.setPosition(data.x, data.y);
          }
        } catch (err) {
          console.error("Ошибка в dataChannel:", err);
        }
      };
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
