
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
          class="list-group-item"
          v-for="item in messages"
        >
          <span>
            {{item.alias}}:
          </span>
          <br>
          <span>
            {{ item.message }}
          </span>
        </li>
      </ul>

      <form @submit.prevent="sendMessage" v-if="connected">
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
import { createSocket } from './socket';
import {ref, onMounted, watchEffect, computed} from 'vue'

const connected = ref(false);
const socket = ref(null);
const socketProtocol = ref('wss:')
const gameServerDomain = ref("localhost:7654")
const alias = ref("testName");
const messageInput = ref(null);

const messages = ref([
  {
    alias: "Ole",
    message: "Old message 1 Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin justo purus, iaculis eu sagittis ultrices, bibendum ut diam. Sed augue tortor, sagittis eu mollis a, varius eget metus. In tincidunt auctor tortor. Phasellus sit amet consectetur libero. Nam viverra sollicitudin purus, in venenatis lectus. In arcu mi, congue nec posuere."
  },
  {
    alias: "Henrik",
    message: "Old message 2 Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin justo purus, iaculis eu sagittis ultrices, bibendum ut diam. Sed augue tortor, sagittis eu mollis a, varius eget metus. In tincidunt auctor tortor. Phasellus sit amet consectetur libero. Nam viverra sollicitudin purus, in venenatis lectus. In arcu mi, congue nec posuere."
  },
  {
    alias: "Kåre",
    message: "Old message 3 Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin justo purus, iaculis eu sagittis ultrices, bibendum ut diam. Sed augue tortor, sagittis eu mollis a, varius eget metus. In tincidunt auctor tortor. Phasellus sit amet consectetur libero. Nam viverra sollicitudin purus, in venenatis lectus. In arcu mi, congue nec posuere."
  }])

onMounted(() => {
  console.log("location.protocol", location.protocol)
  if (location.protocol === 'http:') {
    socketProtocol.value = 'ws:'
  }
})

const scrollToBottom = () => {
  messageElement.value.scrollTop = messageElement.value.scrollHeight;
}

watchEffect(() => {
  if(messages.value.length === 0) return;
  // scrollToBottom();
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

const connect = () => {
  // if(!this.validateUrl()) return;
  if(!validateAlias()) return;

  socket.value = createSocket(webSocketHost.value, alias.value) 

  connected.value = true;
}

const disconnect = () => {
  messages.value = [];
  alias.value = null;
  gameServerDomain.value = null;
  connected.value = false;
}

const sendMessage = () => {
  socket.value.send(JSON.stringify({
    alias: alias.value,
    message: messageInput.value
  }))

  messageInput.value = null;
}

const validateUrl = () => {
  let valid = /^[a-zA-Z0-9-]+\.[a-zA-Z0-9\d-]+\.[a-z]+$/.test(gameServerDomain.value || "")
  if(!valid) alert("Not a valid game server URL")

  return valid;
}

const validateAlias = () => {
  let valid = /^[a-zA-Z]\w*$/.test(alias.value || "")
  if(!valid) alert("Not a valid alias.")

  console.log("alias: ", alias.value, ", valid:", valid);

  return valid;
}

</script>