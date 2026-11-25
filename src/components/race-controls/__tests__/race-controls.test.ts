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

    await wrapper.setProps({ playbackSpeed: 2 })

    expect(selected.attributes('aria-pressed')).toBe('false')
    expect(wrapper.get('button[aria-pressed="true"]').attributes('aria-label')).toBe(
      '2 times playback speed',
    )
  } finally {
    wrapper.unmount()
  }
})

it('blocks Start before a program exists and allows Generate Program', async () => {
  const wrapper = mount(RaceControls, { props: { playbackSpeed: 1 } })

  try {
    const controls = wrapper.get('[role="group"][aria-label="Race controls"]')
    const generate = controls.get(':scope > button:first-child')
    const start = controls.get(':scope > button:nth-child(2)')
    expect(generate.text()).toBe('Generate program')
    expect(generate.element.hasAttribute('disabled')).toBe(false)
    expect(start.element.hasAttribute('disabled')).toBe(true)

    await start.trigger('click')
    await generate.trigger('click')

    expect(wrapper.emitted('start-race')).toBeUndefined()
    expect(wrapper.emitted('generate-program')).toEqual([[]])
  } finally {
    wrapper.unmount()
  }
})

it('emits Start, Pause, and Resume as the available race action changes', async () => {
  const wrapper = mount(RaceControls, { props: { playbackSpeed: 1, isStartDisabled: false } })

  try {
    const controls = wrapper.get('[role="group"][aria-label="Race controls"]')
    const generate = controls.get(':scope > button:first-child')
    const action = controls.get(':scope > button:nth-child(2)')

    expect(action.element.hasAttribute('disabled')).toBe(false)
    await action.trigger('click')

    await wrapper.setProps({ isGenerateDisabled: true, isStartDisabled: true, canPause: true })
    expect(generate.element.hasAttribute('disabled')).toBe(true)
    expect(action.element.hasAttribute('disabled')).toBe(false)
    await generate.trigger('click')
    await action.trigger('click')

    await wrapper.setProps({ canPause: false, canResume: true })
    expect(action.element.hasAttribute('disabled')).toBe(false)
    await action.trigger('click')

    await wrapper.setProps({ canResume: false })
    expect(generate.element.hasAttribute('disabled')).toBe(true)
    expect(action.element.hasAttribute('disabled')).toBe(true)

    expect(wrapper.emitted('generate-program')).toBeUndefined()
    expect(wrapper.emitted('start-race')).toEqual([[]])
    expect(wrapper.emitted('pause-race')).toEqual([[]])
    expect(wrapper.emitted('resume-race')).toEqual([[]])
  } finally {
    wrapper.unmount()
  }
})

it('replaces generation with reset while a race can be interrupted', async () => {
  const wrapper = mount(RaceControls, {
    props: { playbackSpeed: 1, isGenerateDisabled: true, canReset: true, canPause: true },
  })
  try {
    const action = wrapper.get('button:first-child')
    expect(action.text()).toBe('Reset race')
    expect(action.attributes('disabled')).toBeUndefined()
    await action.trigger('click')
    expect(wrapper.emitted('reset-race')).toEqual([[]])
    expect(wrapper.emitted('generate-program')).toBeUndefined()
    await wrapper.setProps({ canReset: false, canPause: false, isGenerateDisabled: false })
    expect(action.text()).toBe('Generate program')
    await action.trigger('click')
    expect(wrapper.emitted('generate-program')).toEqual([[]])
  } finally {
    wrapper.unmount()
  }
})
