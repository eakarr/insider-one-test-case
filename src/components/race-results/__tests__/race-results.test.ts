// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'

import RaceResults from '@/components/race-results/race-results.vue'
import type { IRaceRoundPresentation } from '@/models/race'

it('lists completed rounds newest first and separates the podium from the remaining finishers', async () => {
  const round: IRaceRoundPresentation = {
    id: 1,
    roundNumber: 1,
    distance: 1200,
    status: 'completed',
    participants: [],
    results: ['Juniper', 'Cinder', 'Breeze', 'Willow'].map((name, index) => ({
      horse: { id: index + 1, name, color: '#347844', colorName: 'Fern', condition: 82 },
      position: index + 1,
      timeSeconds: 8.256 + index,
    })),
  }
  const wrapper = mount(RaceResults, { props: { rounds: [], totalRounds: 6 } })

  try {
    expect(wrapper.text()).toContain('0 of 6')
    expect(wrapper.text()).toContain('Finishing times appear after each round.')

    await wrapper.setProps({
      rounds: [
        round,
        { ...round, id: 2, roundNumber: 2, distance: 1400 },
        {
          ...round,
          id: 3,
          roundNumber: 3,
          distance: 1600,
          status: 'active',
          results: [],
        },
      ],
    })

    expect(wrapper.text()).toContain('2 of 6')
    expect(wrapper.findAll('summary strong').map((heading) => heading.text())).toEqual([
      'Round 2',
      'Round 1',
    ])

    const newest = wrapper.get('details')
    const podium = newest.get('[aria-label="Top three finishers"]')
    expect(podium.findAll('[role="listitem"]')).toHaveLength(3)
    expect(podium.get('[role="listitem"]').text()).toMatch(/Position 1\s*Juniper/)
    const time = podium.get('time')
    expect(time.text()).toBe('8.26 s')
    expect(time.attributes('datetime')).toBe('PT8.26S')
    expect(newest.element.hasAttribute('open')).toBe(false)

    await newest.get('summary').trigger('click')

    expect(newest.element.hasAttribute('open')).toBe(true)
    expect(newest.get('[aria-label="Remaining finishers"]').text()).toMatch(/Position 4\s*Willow/)
  } finally {
    wrapper.unmount()
  }
})
