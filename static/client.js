const socket = io();
const roomId = new URLSearchParams(location.search).get("id");
const pcs = {};
const msgView = document.getElementById("msgView");

socket.emit("join", roomId);

socket.on("peers", ids => ids.forEach(id => createPeer(id, true)));
socket.on("new-peer", id => createPeer(id, false));
socket.on("signal", async ({ from, signal }) => {
  let pc = pcs[from];
  if (!pc) pc = createPeer(from, false);
  if (signal.type) await pc.setRemoteDescription(signal);
  else if (signal.candidate) await pc.addIceCandidate(signal.candidate);
});

function createPeer(id, isOfferer) {
  const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
  pcs[id] = pc;

  pc.ondatachannel = e => {
    e.channel.onmessage = ev => {
      msgView.textContent = ev.data;
    };
  };

  pc.onicecandidate = e => {
    if (e.candidate) socket.emit("signal", { to: id, signal: { candidate: e.candidate } });
  };

  if (isOfferer) {
    pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .then(() => socket.emit("signal", { to: id, signal: pc.localDescription }));
  }

  return pc;
}
