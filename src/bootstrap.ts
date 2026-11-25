import { createPinia } from 'pinia'
import { createApp } from 'vue'

import '@/styles/main.scss'

import App from './app.vue'

const dismissSplashScreen = (): void => {
  const splashScreen = document.getElementById('startup-screen')

  if (!splashScreen) return

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true

  const minimumDuration = isStandalone ? 800 : 0
  const remainingDuration = Math.max(0, minimumDuration - performance.now())

  if (remainingDuration > 0) {
    window.setTimeout(() => {
      splashScreen.setAttribute('data-ready', '')
    }, remainingDuration)
  } else {
    splashScreen.setAttribute('data-ready', '')
  }
}

const app = createApp(App)

app.use(createPinia())
app.mount('#app')

dismissSplashScreen()
