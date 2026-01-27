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
import pty  # Ensure this is uncommented if you're using it below
import threading

# Resolved Conflict: Standardized the commented-out eventlet import
# import eventlet
# eventlet.monkey_patch()  

app = Flask(__name__)
CORS(app)

# Note: You have async_mode="eventlet" here. 
# If you don't use eventlet, you might want to change this to "threading" 
# or install eventlet via pip.
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="eventlet") 

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
    # This requires the 'pty' module to be imported
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

if __name__ == '__main__':
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)