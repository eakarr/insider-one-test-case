import { onMounted, onUnmounted, ref } from 'vue'

type TTheme = 'light' | 'dark'

// Also used by the pre-paint script in index.html.
const STORAGE_KEY = 'race-theme'

export function useTheme() {
  const root = document.documentElement
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
  const theme = ref<TTheme>(root.dataset.theme === 'dark' ? 'dark' : 'light')
  let preference: TTheme | undefined

  try {
    const savedTheme = localStorage.getItem(STORAGE_KEY)
    if (savedTheme === 'light' || savedTheme === 'dark') preference = savedTheme
  } catch {
    // The toggle still works for the current visit.
  }

  function applyTheme(nextTheme: TTheme) {
    theme.value = nextTheme
    root.dataset.theme = nextTheme
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', nextTheme === 'dark' ? '#111714' : '#eef2ef')
  }

  function syncTheme() {
    applyTheme(preference ?? (systemTheme.matches ? 'dark' : 'light'))
  }

  function toggleTheme() {
    preference = theme.value === 'dark' ? 'light' : 'dark'
    applyTheme(preference)

    try {
      localStorage.setItem(STORAGE_KEY, preference)
    } catch {
      // Keep the explicit choice in memory until reload.
    }
  }

  onMounted(() => {
    syncTheme()
    systemTheme.addEventListener('change', syncTheme)
  })
  onUnmounted(() => systemTheme.removeEventListener('change', syncTheme))

  return { theme, toggleTheme }
}
