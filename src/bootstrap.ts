import { createPinia } from 'pinia'
import { createApp } from 'vue'

import '@/styles/main.scss'

import App from './app.vue'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
