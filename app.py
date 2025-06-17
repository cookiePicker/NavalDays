from flask import Flask, request, send_from_directory, abort
from flask_socketio import SocketIO, emit, join_room
import os

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# Пути
STATIC_FOLDER = "static"

# MIME-тип по расширению
def get_mime_type(filename):
    if filename.endswith(".html"):
        return "text/html"
    elif filename.endswith(".js"):
        return "application/javascript"
    elif filename.endswith(".css"):
        return "text/css"
    return "application/octet-stream"

@app.route("/")
def index():
    return send_from_directory(STATIC_FOLDER, "index.html")

@app.route("/<path:filename>")
def static_files(filename):
    full_path = os.path.join(STATIC_FOLDER, filename)
    if os.path.exists(full_path):
        return send_from_directory(STATIC_FOLDER, filename, mimetype=get_mime_type(filename))
    abort(404)

@app.route("/create-room")
def create_room():
    room_id = request.args.get("id")
    if not room_id:
        return "Не указан ID", 400

    room_path = f"rooms/{room_id}.json"
    if os.path.exists(room_path):
        return "Комната уже существует", 409  # Конфликт

    os.makedirs("rooms", exist_ok=True)
    with open(room_path, "w") as f:
        f.write(f'{{"id": "{room_id}", "members": 0, "owner": "none"}}')

    return send_from_directory(STATIC_FOLDER, "room.html")

@app.route("/join-room")
def join_room_route():
    room_id = request.args.get("id")
    if not room_id:
        abort(400, "Room ID is required")

    room_path = os.path.join("rooms", f"{room_id}.json")
    if not os.path.exists(room_path):
        abort(404, "Комната не найдена")

    return send_from_directory(STATIC_FOLDER, "room.html")

# WebSocket Events
@socketio.on("join")
def handle_join(data):
    room = data["room"]
    join_room(room)
    emit("new-peer", request.sid, room=room, include_self=False)

    peer_ids = [
        sid for sid in socketio.server.manager.rooms["/"].get(room, [])
        if sid != request.sid
    ]
    emit("peers", peer_ids)

@socketio.on("signal")
def handle_signal(data):
    to = data["to"]
    signal = data["signal"]
    emit("signal", {"from": request.sid, "signal": signal}, room=to)

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=80)
