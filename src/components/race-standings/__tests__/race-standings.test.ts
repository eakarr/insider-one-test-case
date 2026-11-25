// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'

import RaceStandings from '@/components/race-standings/race-standings.vue'

it('shows a starting lineup by lane and displays live and final rows in the supplied order', async () => {
  const juniper = { id: 1, name: 'Juniper', color: '#347844', colorName: 'Fern', condition: 82 }
  const willow = { id: 2, name: 'Willow', color: '#87442d', colorName: 'Copper', condition: 90 }
  const lineup = [
    { position: 1, horse: juniper },
    { position: 2, horse: willow },
  ]
  const finishOrder = [
    { position: 1, horse: willow },
    { position: 2, horse: juniper },
  ]
  const wrapper = mount(RaceStandings, { props: { standings: [], mode: 'lineup' } })

  try {
    expect(wrapper.text()).toContain('Standings appear when a round is on the track.')

    await wrapper.setProps({ standings: lineup })
    expect(wrapper.get('h2').text()).toBe('Starting lineup')
    expect(
      wrapper
        .get('ol')
        .findAll('li')
        .map((row) => row.text()),
    ).toEqual([
      expect.stringMatching(/^Lane\s*1\s*Juniper$/),
      expect.stringMatching(/^Lane\s*2\s*Willow$/),
    ])

    await wrapper.setProps({ mode: 'live', standings: finishOrder })
    expect(wrapper.get('h2').text()).toBe('Live standings')
    expect(
      wrapper
        .get('ol')
        .findAll('li')
        .map((row) => row.text()),
    ).toEqual([
      expect.stringMatching(/^Position\s*1\s*Willow$/),
      expect.stringMatching(/^Position\s*2\s*Juniper$/),
    ])

    await wrapper.setProps({ mode: 'final' })
    expect(wrapper.get('h2').text()).toBe('Final standings')
    expect(wrapper.get('ol').findAll('li')).toHaveLength(2)
  } finally {
    wrapper.unmount()
  }
})
