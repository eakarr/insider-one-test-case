// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'

import RaceTrack from '@/components/race-track/race-track.vue'
import type { IRaceRoundPresentation } from '@/models/race'

const horse = { id: 1, name: 'Juniper', color: '#347844', colorName: 'Fern', condition: 82 }
const scheduled: IRaceRoundPresentation = {
  id: 1,
  roundNumber: 1,
  distance: 1200,
  status: 'scheduled',
  participants: [{ lane: 3, horse, progress: 0 }],
  results: [],
}
const completed: IRaceRoundPresentation = {
  ...scheduled,
  status: 'completed',
  participants: [{ lane: 3, horse, progress: 100 }],
  results: [{ horse, position: 1, timeSeconds: 8.25 }],
}
const trackProps = {
  horseCount: 20,
  horseMotion: 'still',
  isAnimationFrozen: false,
  isPaused: false,
} as const

it('replaces the empty lanes with the opening lineup and restores focus after Race Again', async () => {
  const round = ref<IRaceRoundPresentation>()
  const isDayComplete = ref(false)
  const host = document.createElement('div')
  document.body.append(host)
  const wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(RaceTrack, {
          ...trackProps,
          round: round.value,
          isDayComplete: isDayComplete.value,
          onGenerateProgram: () => {
            round.value = scheduled
          },
          onRaceAgain: () => {
            round.value = undefined
            isDayComplete.value = false
          },
        }),
    }),
    { attachTo: host },
  )

  try {
    const track = wrapper.getComponent(RaceTrack)
    const lanes = track.get('ol[aria-label="Race lanes"]')
    expect(lanes.findAll('li')).toHaveLength(10)
    expect(lanes.text()).toContain('Lane 3, empty')

    const generate = track.get('button')
    expect(generate.text()).toBe('Generate program')
    generate.element.focus()
    await generate.trigger('click')
    await nextTick()

    expect(track.emitted('generate-program')).toEqual([[]])
    expect(track.text()).toContain('Ready to start')
    expect(lanes.text()).toContain('Lane 3, Juniper, at the start')
    expect(track.find('button').exists()).toBe(false)
    expect(document.activeElement).toBe(track.get('h2').element)

    round.value = completed
    isDayComplete.value = true
    await nextTick()

    const raceAgain = track.get('button')
    expect(raceAgain.text()).toBe('Race again')
    expect(track.get('h3').text()).toBe('Race day complete')
    expect(lanes.text()).toContain('Lane 3, Juniper, finished in position 1')
    raceAgain.element.focus()
    await raceAgain.trigger('click')
    await nextTick()

    expect(track.emitted('race-again')).toEqual([[]])
    expect(track.get('button').text()).toBe('Generate program')
    expect(document.activeElement).toBe(track.get('button').element)
  } finally {
    wrapper.unmount()
    host.remove()
  }
})

it('announces countdown, start, pause, resume, and completion in the status region', async () => {
  const wrapper = mount(RaceTrack, { props: { ...trackProps, round: scheduled } })

  try {
    const status = wrapper.get('[role="status"]')
    const active: IRaceRoundPresentation = { ...scheduled, status: 'active' }
    expect(status.attributes('aria-atomic')).toBe('true')
    expect(status.text()).toBe('')

    await wrapper.setProps({ round: active, countdownCue: 3 })
    expect(wrapper.text()).toMatch(/Round 1 · 1200 m\s*3/)
    expect(status.text()).toBe('Round 1, 1200 meters. Starting in three seconds.')

    await wrapper.setProps({ countdownCue: 2 })
    expect(status.text()).toBe('Two seconds.')
    await wrapper.setProps({ countdownCue: 1 })
    expect(status.text()).toBe('One second.')
    await wrapper.setProps({ countdownCue: 'START!' })
    expect(wrapper.text()).toContain('START!')
    expect(status.text()).toBe('Round 1 started.')

    await wrapper.setProps({
      round: { ...active, participants: [{ lane: 3, horse, progress: 34.6 }] },
      countdownCue: undefined,
      isPaused: true,
      isAnimationFrozen: true,
    })
    expect(wrapper.text()).toContain('Paused')
    expect(wrapper.get('ol[aria-label="Race lanes"]').text()).toContain(
      'Lane 3, Juniper, 35% complete',
    )
    expect(status.text()).toBe('Race paused.')

    await wrapper.setProps({ isPaused: false, isAnimationFrozen: false })
    expect(status.text()).toBe('Race resumed.')
    await wrapper.setProps({ round: completed })
    expect(status.text()).toBe('Round 1 complete. Results are ready.')
    await wrapper.setProps({ isDayComplete: true })
    expect(status.text()).toBe('Race day complete. All results are ready.')
  } finally {
    wrapper.unmount()
  }
})
