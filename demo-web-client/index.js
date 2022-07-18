import { createApp } from 'vue'

const app = {
  data(){
    return {
      connected: false,
      url: null,
      alias: null,
      messageInput: null,
      messages: [
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
        }
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
      if(!this.connected) this.connect()
      else this.disconnect();
    },

    connect(){
      if(!this.validateUrl()) return;
      if(!this.validateAlias()) return;

      this.connected = true;
    },

    disconnect(){
      this.messages = [];
      this.alias = null;
      this.url = null;
      this.connected = false;
    },

    sendMessage(){
      this.messages.push({
        alias: this.alias,
        message: this.messageInput
      });
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