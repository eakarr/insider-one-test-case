// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { createPinia, disposePinia } from 'pinia'
import { expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import RaceControls from '@/components/race-controls/race-controls.vue'
import RacePage from '@/components/race-page/race-page.vue'
import { useRaceStore } from '@/stores/race'

it('confirms reset and preserves the previous pause state when cancelled', async () => {
  const pinia = createPinia()
  const race = useRaceStore(pinia)
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn(() => 1),
  )
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
  const previousTheme = document.documentElement.dataset.theme
  const wrapper = mount(RacePage, { global: { plugins: [pinia] } })
  try {
    const controls = wrapper.getComponent(RaceControls)
    const reset = controls.get('button:first-child')
    race.generateProgram()
    race.startRace()
    await nextTick()
    await reset.trigger('click')
    expect(confirm).toHaveBeenCalledOnce()
    expect(race.status).toBe('countdown')
    race.pause()
    await nextTick()
    await reset.trigger('click')
    expect(race.status).toBe('paused')
    confirm.mockReturnValue(true)
    await reset.trigger('click')
    expect(race.status).toBe('idle')
    expect(reset.text()).toBe('Generate program')
    expect(race.results).toEqual([])
  } finally {
    wrapper.unmount()
    disposePinia(pinia)
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    if (previousTheme === undefined) delete document.documentElement.dataset.theme
    else document.documentElement.dataset.theme = previousTheme
  }
})
