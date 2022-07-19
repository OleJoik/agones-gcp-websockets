

import { io } from "socket.io-client";



export const createSocket = (path, alias) => {
  const socket = new WebSocket(path);

  socket.onopen = e => {
    socket.send(
      
      alias
    )
  }

  socket.onmessage = e => {
    console.log("MESSAGE", e.data)
  }

  return socket;
} 