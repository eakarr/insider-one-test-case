// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'

import HorsePool from '@/components/horse-pool/horse-pool.vue'

it('shows horse conditions in the initial list and adds lane and rank only to the selected field', async () => {
  const juniper = { id: 1, name: 'Juniper', color: '#347844', colorName: 'Fern', condition: 82 }
  const willow = { id: 2, name: 'Willow', color: '#87442d', colorName: 'Copper', condition: 100 }
  const wrapper = mount(HorsePool, { props: { horses: [juniper, willow], groups: [] } })

  try {
    const initial = wrapper.get('ol')
    expect(initial.findAll('li strong[title]').map((name) => name.text())).toEqual([
      'Juniper',
      'Willow',
    ])
    expect(initial.text()).not.toMatch(/Lane|Position/)
    const meter = initial.get('meter[aria-label="Condition 100 out of 100"]')
    expect(meter.attributes('value')).toBe('100')

    await wrapper.setProps({
      groups: [
        { label: 'Selected field', entries: [{ horse: juniper, lane: 3 }] },
        { label: 'Not racing', entries: [{ horse: willow }] },
      ],
    })

    const field = wrapper.get('ol[aria-label="Selected field"]')
    const waiting = wrapper.get('ol[aria-label="Not racing"]')
    expect(field.text()).toMatch(/Juniper.*Flag color: Fern.*Lane 3/)
    expect(field.text()).not.toContain('Position')
    expect(waiting.text()).toContain('Willow')
    expect(waiting.text()).not.toMatch(/Lane|Position/)

    await wrapper.setProps({
      groups: [
        { label: 'Selected field', entries: [{ horse: juniper, lane: 3, position: 1 }] },
        { label: 'Not racing', entries: [{ horse: willow }] },
      ],
    })

    expect(field.text()).toContain('Position #1')
    expect(waiting.text()).not.toMatch(/Lane|Position/)
  } finally {
    wrapper.unmount()
  }
})
