from flask import Flask, request, send_from_directory, render_template_string, abort
import os

app = Flask(__name__)

# Пути
STATIC_FOLDER = "static"
TEMPLATE_ROOM = "templates/room.html"

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
import os
from flask import Flask, request, render_template

app = Flask(__name__)

@app.route("/create-room")
def create_room():
    room_id = request.args.get("id")
    if not room_id:
        return "Не указан ID", 400

    room_path = f"rooms/{room_id}.json"

    if os.path.exists(room_path):
        return "Комната уже существует", 409  # Конфликт

    # Создаем файл комнаты (может быть пустым или с начальной структурой)
    with open(room_path, "w") as f:
          f.write(f'{{"id": "{room_id}", "members": 0, "owner": "none"}}')
    return render_template("room.html", room_id=room_id)
@app.route("/join-room")
def join_room():
    room_id = request.args.get("id")
    if not room_id:
        abort(400, "Room ID is required")
    
    room_path = os.path.join("rooms", f"{room_id}.json")
    if not os.path.exists(room_path):
        abort(404, "Комната не найдена")

    return render_template("room.html", room_id=room_id)
@app.route("/create-room")
@app.route("/join-room")
def room_handler():
    room_id = request.args.get("id", "undefined")
    if os.path.exists(TEMPLATE_ROOM):
        with open(TEMPLATE_ROOM) as f:
            template = f.read()
        return render_template_string(template.replace("{{ROOM_ID}}", room_id))
    return "Room template not found", 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=80)
