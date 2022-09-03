import threading
from database import database
from envReader import *
from engine import Engine
import socketio
from flask import Flask, request
import eventlet
from flask_cors import CORS
from json import loads

read()

db = database()
server = socketio.Server(cors_allowed_origins='*')
app = Flask(__name__)
CORS(app)

@server.event
def event(sid, data):
    print(sid, data)

@server.event
def connect(sid, environ, auth):
    print('connect ', sid)

@server.event
def disconnect(sid):
    print('disconnect ', sid)

@server.on('data')
def data_event(sid, data):
    print(sid, data) 

@server.on('*')
async def catch_all(event, sid, data):
    print(event, sid, data)

def send(packet, data):
    server.emit(packet, data)

def serve_app(_sio, _app):
    _app = socketio.Middleware(_sio, _app)
    eventlet.wsgi.server(eventlet.listen(('', getNumber('SERVER_PORT'))), _app)

@app.route('/', methods=['GET', 'POST'])
def index():
    return 'not supported!'

@app.route('/ping', methods=['GET'])
def ping():
    return 'ok'

@app.route('/login', methods=['POST'])
def login():
    data = request.data
    resp = db.login(data['username'], data['password'])
    return resp

@app.route('/loginWithPin', methods=['POST'])
def loginWithPin():
    data = request.data
    resp = db.loginWithPin(data['username'], data['pin'])
    return resp

@app.route('/user_has_pin', methods=['GET'])
def user_has_pin():
    data = request.data
    resp = db.userHasPin(data['username'])
    return resp

app = socketio.Middleware(server, app)
wst = threading.Thread(target=serve_app, args=(server,app))
wst.daemon = True
wst.start()
eng = Engine(getBoolean('HEADLESS_MODE'))
eng.run()