// gameserver.js

import AgonesSDK from '@google-cloud/agones-sdk'

import express from 'express';
import { createServer } from 'http'
import { Server } from 'socket.io'

const port = process.env.PORT || 7654;

const app = express()
const server = createServer(app)
const io = new Server(server, {
    cors: {
				origin: "http://localhost:3000",
    }
})

io.on('connection', (socket) => {  
    console.log("new connection!")  
    socket.on('chat message', msg => {
        console.log("new chat message: ", msg)
        io.emit('chat message', msg);
    });
});

server.listen(port, () => {
    console.log(`Server listening on port ${port}`)
});

const connect = async () => {
	let agonesSDK = new AgonesSDK();
	
	console.log(`Connecting to the SDK server...`);
	await agonesSDK.connect();
	console.log('...connected to SDK server');

	setInterval(() => {
		agonesSDK.health();
	}, 5000)

	console.log("Getting ready...")
	await agonesSDK.ready();
	console.log("... Ready!")
};

connect();