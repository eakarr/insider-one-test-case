// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'

import ThemeToggle from '@/components/common/theme-toggle/theme-toggle.vue'

it('names the destination theme and emits a toggle request through its native button', async () => {
  const wrapper = mount(ThemeToggle, { props: { isDark: false } })

  try {
    const button = wrapper.get('button')
    expect(button.attributes('aria-label')).toBe('Switch to dark theme')

    await button.trigger('click')
    expect(wrapper.emitted('toggle')).toEqual([[]])

    await wrapper.setProps({ isDark: true })
    expect(button.attributes('aria-label')).toBe('Switch to light theme')
  } finally {
    wrapper.unmount()
  }
})
