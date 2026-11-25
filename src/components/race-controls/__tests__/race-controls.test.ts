// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'

import RaceControls from '@/components/race-controls/race-controls.vue'

it('marks the selected playback speed and emits a requested change', async () => {
  const wrapper = mount(RaceControls, { props: { playbackSpeed: 1 } })

  try {
    const selected = wrapper.get('button[aria-pressed="true"]')
    expect(selected.attributes('aria-label')).toBe('1 times playback speed')

    await wrapper.get('button[aria-label="2 times playback speed"]').trigger('click')

    expect(wrapper.emitted('change-speed')).toEqual([[2]])
  } finally {
    wrapper.unmount()
  }
})
