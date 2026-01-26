from flask import Flask, render_template, jsonify, request, send_from_directory, Response, render_template_string
from streamReceiver import receive_stream
from flask_cors import CORS
from startup import competitionMission
import asyncio
# import folium
import socket
import threading

from flask_socketio import SocketIO, emit
import os
# import pty
import threading
#import eventlet
#eventlet.monkey_patch()  
app = Flask(__name__)
CORS(app)

socketio = SocketIO(app, cors_allowed_origins="*", async_mode="eventlet")  # async_mode defaults to 'threading'

sessions = {}

def read_and_emit_output(fd, sid):
    while True:
        try:
            data = os.read(fd, 1024)
            if not data:
                break

            data = data.decode(errors="ignore")

            socketio.emit("output", data, to=sid)
        except OSError:
            break

@socketio.on("connect")
def handle_connect():
    sid = request.sid
    pid, fd = pty.fork()

    if pid == 0:
        # Child process: start bash shell
        os.execvp("bash", ["bash"])
    else:
        sessions[sid] = fd
        socketio.start_background_task(read_and_emit_output, fd, sid)

@socketio.on("input")
def handle_input(data):
    sid = request.sid
    fd = sessions.get(sid)
    if fd:
        os.write(fd, data.encode())

@socketio.on("disconnect")
def handle_disconnect():
    sid = request.sid
    fd = sessions.pop(sid, None)
    if fd:
        try:
            os.close(fd)
        except OSError:
            pass

def get_local_ip():
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except Exception as e:
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/js/<path:path>')
def send_js(path):
    return send_from_directory('js', path)


@app.route('/assets/<path:path>')
def send_assets(path):
    return send_from_directory('../assets', path)

@app.route('/node_modules/<path:path>')
def send_node_modules(path):
    return send_from_directory('../node_modules', path)

@app.route('/startup/<path:path>')
def send_startUp(path):
    result = competitionMission.main()
    return jsonify({"message": result})

@app.route('/get-ip', methods=['GET'])
def get_ip():
    ip = get_local_ip()
    return jsonify({"ip": ip})

# def generateMap():
#     robot_location = {"lat": 38.3753855364, "lon": -110.8302205892}
#     m = folium.Map(location=[robot_location["lat"], robot_location["lon"]], zoom_start=12)
#     m.save("./templates/map.html")


# @app.route('/ros/<path:path>')
# def send_ros(path):
#     return send_from_directory('./ros', path)

if __name__ == '__main__':
    # generateMap()
    # app.run(host='0.0.0.0', port=5000, debug=True)
    socketio.run(app, host="0.0.0.0", port=5000, debug=True) 