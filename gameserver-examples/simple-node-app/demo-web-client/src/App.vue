
<template>
  <div 
      class="container"
      style="display: flex; flex-flow: column; height: 100vh; max-width: 400px"
    >
      <nav class="navbar bg-light">
        <div class="container-fluid">
          <a class="navbar-brand" href="#" onClick="return false;">Demo chat app</a>
        </div>
      </nav>

      <div>
        <label for="server-url">Gameserver url</label>
        <input 
          v-model="gameServerDomain"
          type="text" 
          class="form-control" 
          id="server-url" 
          placeholder="gameserver-1234.yourdomain.com"
          :disabled="connected"
        >

        <div class="row">
          <div class="col-6">
            <label for="alias">Alias</label>
            <input 
              v-model="alias"
              type="text" 
              class="form-control" 
              id="alias"
              placeholder="alias"
              :disabled="connected"
            >
          </div>
          <div class="col-6 d-flex flex-column justify-content-end">
            <button 
              type="button" 
              class="btn btn-primary position-relative bottom-0 mt-2"
              style="width: 100%; bottom: 0"
              @click="connectClicked"
            >
              {{ buttonText }}
              <span 
                v-if="connected"
                class="position-absolute 
                  top-0 start-0 
                  translate-middle 
                  p-2 bg-danger 
                  border border-light rounded-circle
              ">
                <span class="visually-hidden">New alerts</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      <ul 
        v-if="connected"
        ref="messageElement" 
        class="list-group list-group-flush mb-3 mt-3"
        style="
          flex: 1; 
          overflow: auto; 
          border-top: 2px solid rgba(0, 0, 0, 0.125);
        ">
        <li 
          v-if="messages.length>0"
          class="list-group-item"
          v-for="item in messages"
        >
          {{item.alias}}:
          <br>
          {{ item.message }}
        </li>
        <li
          v-else
          class="list-group-item"
        >
          Start the conversation...
        </li>
      </ul>

      <form @submit.prevent="sendMessageTriggered" v-if="connected">
        <div class="input-group input-group-lg pb-3">
          <input type="text" class="form-control" v-model="messageInput">
          <span class="input-group-text">
            <i class="bi bi-send"></i>
          </span>
        </div>
      </form>
    </div>
</template>

<script setup>
import { createSocket, sendMessage, disconnectSocket } from './socket';
import {ref, onMounted, watchEffect, computed} from 'vue'

const messageElement = ref(null);
const connected = ref(false);
const socketProtocol = ref('wss:')
const gameServerDomain = ref(null)
const alias = ref(null);
const messageInput = ref(null);
const messages = ref([])

onMounted(() => {
  console.log("location.protocol", location.protocol)
  if (location.protocol === 'http:') {
    socketProtocol.value = 'ws:'
  }
})

const scrollToBottom = () => {
  if(messageElement.value)
  messageElement.value.scrollTop = messageElement.value.scrollHeight;
}

watchEffect(() => {
  if(messages.value.length === 0) return;
  scrollToBottom();
})

const buttonText = computed(() => {
  let text = "Connect"
  if(connected.value) text = "Disconnect"
  return text
})

const webSocketHost = computed(() => {
  return socketProtocol.value + '//' + gameServerDomain.value;
})

const connectClicked = () => {
  if(!connected.value) connect()
  else disconnect();
}

const connect = async () => {
  // if(!this.validateUrl()) return;
  if(!validateAlias()) return;

  messages.value = await createSocket(
    webSocketHost.value, alias.value,
    (alias, message) => {
      messages.value.push({alias, message})
    }
  )

  connected.value = true;
}

const disconnect = () => {
  messages.value = [];
  alias.value = null;
  gameServerDomain.value = null;
  connected.value = false;
  disconnectSocket()
}

const sendMessageTriggered = () => {
  sendMessage(alias.value, messageInput.value)
  messageInput.value = null;
}

// const validateUrl = () => {
//   let valid = /^[a-zA-Z0-9-]+\.[a-zA-Z0-9\d-]+\.[a-z]+$/.test(gameServerDomain.value || "")
//   if(!valid) alert("Not a valid game server URL")

//   return valid;
// }

const validateAlias = () => {
  let valid = /^[a-zA-Z]\w*$/.test(alias.value || "")
  if(!valid) alert("Not a valid alias.")

  return valid;
}

</script>