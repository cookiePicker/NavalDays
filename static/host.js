const socket = io();
const roomId = new URLSearchParams(location.search).get("id");
const pcs = {}, dcs = {};
const input = document.getElementById("msgInput");

socket.emit("join", roomId);

socket.on("peers", ids => ids.forEach(id => createPeer(id, true)));
socket.on("new-peer", id => createPeer(id, true));
socket.on("signal", async ({ from, signal }) => {
  let pc = pcs[from];
  if (!pc) pc = createPeer(from, false);
  if (signal.type) await pc.setRemoteDescription(signal);
  else if (signal.candidate) await pc.addIceCandidate(signal.candidate);
});

function createPeer(id, isOfferer) {
  const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
  pcs[id] = pc;

  if (isOfferer) {
    const dc = pc.createDataChannel("chat");
    setupDC(dc);
    dcs[id] = dc;
  } else {
    pc.ondatachannel = e => {
      setupDC(e.channel);
      dcs[id] = e.channel;
    };
  }

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

function setupDC(dc) {
  dc.onopen = () => console.log("DC open");
  dc.onclose = () => console.log("DC closed");
}

input.addEventListener("input", () => {
  const text = input.value;
  for (let id in dcs) {
    if (dcs[id].readyState === "open") {
      dcs[id].send(text);
    }
  }
});
