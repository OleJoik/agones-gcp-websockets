// gameserver.js

import AgonesSDK from '@google-cloud/agones-sdk'

import express from 'express';
import { createServer } from 'http'
import { Server } from 'socket.io'

const port = process.env.PORT || 7654;

let agonesSDK = new AgonesSDK();
let status = null;

const users = {}
let messages = []

const app = express()
const server = createServer(app)
const io = new Server(server, {
	cors: {
		origin: ["http://localhost:*", "https://agones-socketio.netlify.app/:*"],
		methods: ["GET", "POST"]
		// allowedHeaders: ["Access-Control-Allow-Origin"],
	}
})

const authenticate = (name) => {
	if(!/^[a-zA-Z]\w*$/.test(name || "")){
		return `Authentication attempt: Name ${name} is invalid`;
	}

	return null
}

io.on('connection', async (socket) => {
	const socketId = socket.id;
	const name = socket.handshake.auth.token

	let err = authenticate(name)
	if(err){
		socket.emit("error", err)
		socket.disconnect();
		return;
	}

	users[socketId] = name;
	console.log(`User ${name} connected`)
	socket.emit('messages', messages)

	if(status === "Ready"){
		await agonesSDK.allocate();
	}
	
	socket.on('newMessage', (data) => {
		console.log("new chat message: ", data)
		messages.push(data);
		io.emit('newMessage', data);
	});

	socket.conn.on("close", reason => {
		console.log(`Socket closed. user: ${users[socket.id]}, reason: ${reason}`)
		delete users[socketId]

		if(Object.keys(users).length === 0){
			console.log("All users have left the server")
			console.log("Resetting server")
			messages = []
			agonesSDK.ready();
		}
	})
});

server.listen(port, () => {
    console.log(`Server listening on port ${port}`)
});

const prepareGameserver = async () => {	
	console.log(`Connecting to the SDK server...`);
	await agonesSDK.connect();

	setInterval(() => {
		agonesSDK.health();
	}, 5000)

	console.log("Getting ready...")
	await agonesSDK.ready();

	agonesSDK.watchGameServer(gameServer => {
		status = gameServer.status.state
		console.log("Gameserver Status", status)
	})
};

prepareGameserver();