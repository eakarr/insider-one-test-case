// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'

import RaceProgram from '@/components/race-program/race-program.vue'
import type { IRaceRoundPresentation } from '@/models/race'

it('shows round statuses and reveals the current round lineup in a native disclosure', async () => {
  const horse = { id: 1, name: 'Juniper', color: '#347844', colorName: 'Fern', condition: 82 }
  const round: IRaceRoundPresentation = {
    id: 1,
    roundNumber: 1,
    distance: 1200,
    status: 'scheduled',
    participants: [{ lane: 4, horse, progress: 0 }],
    results: [],
  }
  const wrapper = mount(RaceProgram, { props: { rounds: [] } })

  try {
    expect(wrapper.text()).toContain('Generate a program')
    expect(wrapper.find('details').exists()).toBe(false)

    await wrapper.setProps({
      currentRound: 1,
      rounds: [round, { ...round, id: 2, roundNumber: 2, distance: 1400 }],
    })

    const current = wrapper.get('details[aria-current="step"]')
    const summary = current.get('summary')
    expect(summary.text()).toMatch(/Round 1 · 1200 m\s*Ready/)
    expect(wrapper.get('details:not([aria-current]) summary').text()).toMatch(
      /Round 2 · 1400 m\s*Pending/,
    )
    expect(current.element.hasAttribute('open')).toBe(false)

    await summary.trigger('click')

    expect(current.element.hasAttribute('open')).toBe(true)
    expect(current.get('ol[aria-label="Horses in lane order"] li').text()).toMatch(
      /Lane 4\s*Juniper\s*· Fern/,
    )
    await summary.trigger('click')
    expect(current.element.hasAttribute('open')).toBe(false)

    await wrapper.setProps({ rounds: [{ ...round, status: 'active' }] })
    expect(summary.text()).toContain('Racing')
    await wrapper.setProps({ rounds: [{ ...round, status: 'completed' }] })
    expect(summary.text()).toContain('Finished')
  } finally {
    wrapper.unmount()
  }
})
