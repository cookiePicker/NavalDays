function createRoom() {
  const id = document.getElementById("newRoomID").value;
  if (id) {
    location.href = `/create-room?id=${id}`;
  }
}
function joinRoom() {
  const id = document.getElementById("roomID").value;
  if (id) {
    location.href = `/join-room?id=${id}`;
  }
}
