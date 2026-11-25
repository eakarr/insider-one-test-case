import { expect, test } from '@playwright/test'

test.use({ viewport: { width: 375, height: 812 }, colorScheme: 'light' })

test('fits the mobile controls into two rows and supports keyboard navigation', async ({
  page,
  browserName,
}) => {
  await page.goto('/')
  const header = page.getByRole('banner')
  const skip = page.getByRole('link', { name: 'Skip to content' })
  const theme = header.getByRole('button', { name: 'Switch to dark theme' })
  const generate = header.getByRole('button', { name: 'Generate program' })
  const start = header.getByRole('button', { name: 'Start race', exact: true })
  const playback = header.getByRole('group', { name: 'Playback speed' })
  const speedButtons = playback.getByRole('button')

  await expect(header).toMatchAriaSnapshot(`
    - button "Switch to dark theme"
    - group "Race controls":
      - button "Generate program"
      - button "Start race" [disabled]
      - group "Playback speed":
        - button "1 times playback speed" [pressed]
        - button "2 times playback speed"
        - button "3 times playback speed"
  `)

  if (browserName === 'chromium') {
    const session = await page.context().newCDPSession(page)
    try {
      const { nodes } = await session.send('Accessibility.getFullAXTree')
      const controls = nodes.find(
        (node) =>
          !node.ignored && node.role?.value === 'group' && node.name?.value === 'Race controls',
      )
      expect(
        controls?.childIds?.map((id) => nodes.find((node) => node.nodeId === id)?.name?.value),
      ).toEqual(['Generate program', 'Start race', 'Playback speed'])
    } finally {
      await session.detach()
    }
  }

  const [toggleBox, generateBox, startBox, playbackBox] = await Promise.all([
    theme.boundingBox(),
    generate.boundingBox(),
    start.boundingBox(),
    playback.boundingBox(),
  ])
  if (!toggleBox || !generateBox || !startBox || !playbackBox) {
    throw new Error('Expected visible race controls')
  }

  const centerY = ({ y, height }: { y: number; height: number }) => y + height / 2
  expect(centerY(generateBox)).toBeCloseTo(centerY(toggleBox), 0)
  expect(centerY(startBox)).toBeCloseTo(centerY(toggleBox), 0)
  expect(playbackBox.y).toBeGreaterThan(startBox.y + startBox.height)
  expect(playbackBox.x).toBeCloseTo(toggleBox.x, 0)
  expect(playbackBox.x + playbackBox.width).toBeCloseTo(startBox.x + startBox.width, 0)
  await expect(speedButtons).toHaveCount(3)
  const buttonWidths = await speedButtons.evaluateAll((buttons) =>
    buttons.map((button) => button.getBoundingClientRect().width),
  )
  expect(Math.max(...buttonWidths) - Math.min(...buttonWidths)).toBeLessThan(1)
  expect(await page.locator('html').evaluate((root) => root.scrollWidth - root.clientWidth)).toBe(0)

  // WebKit ports can differ in whether links are included in the default Tab order.
  await page.keyboard.press('Tab')
  if (browserName !== 'webkit' || (await skip.evaluate((link) => link.matches(':focus')))) {
    await expect(skip).toBeFocused()
    await page.keyboard.press('Tab')
  }
  await expect(theme).toBeFocused()
  for (const control of [generate, speedButtons.nth(0), speedButtons.nth(1)]) {
    await page.keyboard.press('Tab')
    await expect(control).toBeFocused()
  }
  await page.keyboard.press('Space')
  await expect(speedButtons.nth(1)).toHaveAttribute('aria-pressed', 'true')

  await skip.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('main')).toBeFocused()

  const status = page.getByRole('region', { name: 'Race track' }).getByRole('status')
  await expect(status).toHaveAttribute('aria-atomic', 'true')
})

test('persists theme changes across reloads', async ({ page }) => {
  await page.goto('/')
  const themeRoot = page.locator('html')
  const dark = page.getByRole('button', { name: 'Switch to dark theme' })
  const light = page.getByRole('button', { name: 'Switch to light theme' })

  await expect(themeRoot).toHaveAttribute('data-theme', 'light')
  await dark.click()
  await expect(themeRoot).toHaveAttribute('data-theme', 'dark')
  await page.reload()
  await expect(light).toBeVisible()
  await expect(themeRoot).toHaveAttribute('data-theme', 'dark')
  await light.click()
  await expect(dark).toBeVisible()
  await expect(themeRoot).toHaveAttribute('data-theme', 'light')
})

test('centers the initial guide inside the lane area at narrow widths', async ({ page }) => {
  for (const width of [320, 375, 393, 767]) {
    await page.setViewportSize({ width, height: 852 })
    await page.goto('/')
    const track = page.getByRole('region', { name: 'Race track' })
    const card = track.locator('.race-track__card')
    const lanes = track.getByRole('list', { name: 'Race lanes' })
    const [cardBox, laneBox] = await Promise.all([card.boundingBox(), lanes.boundingBox()])
    if (!cardBox || !laneBox) throw new Error('Expected visible guide and lanes')
    expect(Math.abs(cardBox.x + cardBox.width / 2 - laneBox.x - laneBox.width / 2)).toBeLessThan(1)
    expect(Math.abs(cardBox.y + cardBox.height / 2 - laneBox.y - laneBox.height / 2)).toBeLessThan(
      1,
    )
    expect(await page.locator('html').evaluate((root) => root.scrollWidth - root.clientWidth)).toBe(
      0,
    )
  }
})

test('keeps the dashboard within the viewport across breakpoints and themes', async ({ page }) => {
  for (const width of [320, 375, 768, 992, 1200, 1600]) {
    await page.setViewportSize({ width, height: 768 })
    await page.goto('/')
    const header = page.getByRole('banner')
    const track = page.getByRole('region', { name: 'Race track' })
    await header.getByRole('button', { name: 'Generate program' }).click()
    for (const theme of ['light', 'dark']) {
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      await expect(track.getByText('Ready to start')).toBeVisible()
      expect(
        await page.locator('html').evaluate((root) => root.scrollWidth - root.clientWidth),
      ).toBe(0)
      if (theme === 'light')
        await header.getByRole('button', { name: 'Switch to dark theme' }).click()
    }
    await header.getByRole('button', { name: 'Switch to light theme' }).click()
  }
})
