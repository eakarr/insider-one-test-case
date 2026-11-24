import { createApp } from 'vue'

import type { IRaceDashboard } from '@/models/race'
import '@/styles/main.scss'

import App from './app.vue'

async function mountDashboard() {
  let preview: IRaceDashboard | undefined
  if (import.meta.env.DEV) {
    const scenario = new URLSearchParams(window.location.search).get('scenario')
    if (scenario) {
      try {
        const { getMockRaceScenario } = await import('@/mocks/race-scenarios')
        preview = getMockRaceScenario(scenario)
      } catch (error) {
        console.warn('Race preview unavailable. Opening the initial dashboard.', error)
      }
    }
  }

  const app = createApp(App, { preview })
  try {
    const { createPinia } = await import('pinia')
    app.use(createPinia())
  } catch (error) {
    if (
      !import.meta.env.DEV ||
      !(error instanceof DOMException) ||
      error.name !== 'SecurityError'
    ) {
      throw error
    }
    // Pinia's development tooling can access storage while loading.
    console.warn('Pinia development tooling could not access browser storage.', error)
  }
  app.mount('#app')
}

void mountDashboard()
