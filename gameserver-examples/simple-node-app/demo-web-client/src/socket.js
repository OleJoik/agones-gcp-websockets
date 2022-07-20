
import { io } from "socket.io-client";

let socket = null;

export const createSocket = async (path, alias, messageCallback) => {
  return new Promise((resolve) => {
    socket = io(path, {
      auth: {
        token: alias
      },
      transports: ['websocket']
    })
  
    socket.on('connect', () => {
      console.log("Websocket connected")
    })
    
    socket.on('error', message => {
      throw message
    })
  
    socket.on("newMessage", data => {
      messageCallback(data.alias, data.message);
    })

    socket.on("messages", messages => {
      resolve(messages)
    })
  })
} 

export const sendMessage = (alias, message) => {
  if(socket.connected) socket.emit("newMessage", {alias, message})
  else alert("Not connected!")
}

export const disconnectSocket = () => {
  socket.disconnect()
}