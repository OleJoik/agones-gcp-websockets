import { createApp } from 'vue'

const app = {
  data(){
    return {
      connected: false,
      url: null,
      alias: null,
      messageInput: null,
      messages: [
        "Old message 1",
        "Old message 2",
        "Old message 3",
      ]
    }
  },
  watch: {
    messages: {
      handler(){
        this.scrollToBottom();
      },
      deep: true,
      flush: 'post'
    }
  },
  computed: {
    buttonText(){
      let text = "Connect"
      if(this.connected) text = "Disconnect"
      return text
    }
  },
  methods: {
    connectClicked(){      
      if(!this.validateUrl()) return;
      if(!this.validateAlias()) return;

      this.connected = !this.connected;
    },

    sendMessage(){
      this.messages.push(this.messageInput);
      this.messageInput = null;
    },

    scrollToBottom(){
      this.$refs.messageElement.scrollTop = this.$refs.messageElement.scrollHeight;
    },

    validateUrl(){
      let valid = /^[a-zA-Z0-9-]+\.[a-zA-Z0-9\d-]+\.[a-z]+$/.test(this.url || "")
      if(!valid) alert("Not a valid game server URL")

      return valid;
    },

    validateAlias(){
      console.log(this.alias);
      let valid = /^[a-zA-Z]\w*$/.test(this.alias || "")
      if(!valid) alert("Not a valid alias.")
    
      return valid;
    }
  }
}

createApp(app).mount('#app')