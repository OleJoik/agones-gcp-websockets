import { createApp } from 'vue'

const app = {
  data(){
    return {
      message: "Hello world"
    }
  }
}

createApp(app).mount('#app')