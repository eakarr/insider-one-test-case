// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

import { useTheme } from '@/composables/use-theme'

const storageKey = 'race-theme'
let unmount: (() => void) | undefined
let initialTheme: string | undefined
let initialPreference: string | null

beforeEach(() => {
  initialTheme = document.documentElement.dataset.theme
  initialPreference = localStorage.getItem(storageKey)
  localStorage.removeItem(storageKey)
})

afterEach(() => {
  unmount?.()
  unmount = undefined
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  if (initialPreference === null) localStorage.removeItem(storageKey)
  else localStorage.setItem(storageKey, initialPreference)
  if (initialTheme === undefined) delete document.documentElement.dataset.theme
  else document.documentElement.dataset.theme = initialTheme
})

function mountTheme(matches: boolean) {
  const media = Object.assign(new EventTarget(), { matches })
  vi.stubGlobal('matchMedia', () => media)
  const add = vi.spyOn(media, 'addEventListener')
  const remove = vi.spyOn(media, 'removeEventListener')
  const wrapper = mount(
    defineComponent({
      setup: useTheme,
      render: () => null,
    }),
  )

  function dispose() {
    wrapper.unmount()
    unmount = undefined
  }
  unmount = dispose

  function changeSystemTheme(dark: boolean) {
    media.matches = dark
    media.dispatchEvent(new Event('change'))
  }

  return { theme: wrapper.vm, changeSystemTheme, add, remove, dispose }
}

it.each([null, 'invalid'])('follows the system with a stored value of %s', (stored) => {
  if (stored !== null) localStorage.setItem(storageKey, stored)
  const { theme, changeSystemTheme } = mountTheme(true)

  expect(theme.theme).toBe('dark')
  expect(document.documentElement.dataset.theme).toBe('dark')

  changeSystemTheme(false)

  expect(theme.theme).toBe('light')
  expect(document.documentElement.dataset.theme).toBe('light')
})

it('uses the saved preference, persists a toggle, and keeps it through system changes', () => {
  localStorage.setItem(storageKey, 'light')
  const { theme, changeSystemTheme } = mountTheme(true)
  expect(theme.theme).toBe('light')
  expect(document.documentElement.dataset.theme).toBe('light')

  theme.toggleTheme()
  changeSystemTheme(false)

  expect(theme.theme).toBe('dark')
  expect(document.documentElement.dataset.theme).toBe('dark')
  expect(localStorage.getItem(storageKey)).toBe('dark')
})

it('falls back to the system after a read failure and keeps an in-memory choice after a write failure', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new DOMException('Storage is blocked', 'SecurityError')
  })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('Storage is blocked', 'SecurityError')
  })
  const { theme, changeSystemTheme } = mountTheme(false)
  expect(theme.theme).toBe('light')

  theme.toggleTheme()
  changeSystemTheme(false)

  expect(theme.theme).toBe('dark')
  expect(document.documentElement.dataset.theme).toBe('dark')
})

it('removes the same media listener on unmount and stops updating the document', () => {
  const { changeSystemTheme, add, remove, dispose } = mountTheme(false)
  const listener = add.mock.calls.find(([event]) => event === 'change')?.[1]
  expect(listener).toBeDefined()

  dispose()
  changeSystemTheme(true)

  expect(remove).toHaveBeenCalledWith('change', listener)
  expect(document.documentElement.dataset.theme).toBe('light')
})
