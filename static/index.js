function createRoom() {
  const id = document.getElementById("newRoomID").value.trim();
  if (id) {
    location.href = `/create-room?id=${id}&creator=1`;
  } else {
    alert("Введите ID комнаты.");
  }
}

function joinRoom() {
  const id = document.getElementById("roomID").value.trim();
  if (id) {
    location.href = `/join-room?id=${id}`;
  } else {
    alert("Введите ID комнаты.");
  }
}
