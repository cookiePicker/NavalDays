function createRoom() {
  const id = document.getElementById("CreateID").value;
  if (id) location.href = `/create-room?id=${id}&creator=1`;
}

function joinRoom() {
  const id = document.getElementById("roomID").value;
  if (id) location.href = `/join-room?id=${id}`;
}
