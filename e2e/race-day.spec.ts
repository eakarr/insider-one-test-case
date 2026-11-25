import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('generates six scheduled lineups and puts the opening field on the track', async ({
  page,
}) => {
  const header = page.getByRole('banner')
  const startRace = header.getByRole('button', { name: 'Start race', exact: true })
  const program = page.getByRole('region', { name: 'Program' })
  const track = page.getByRole('region', { name: 'Race track' })
  const lanes = track.getByRole('list', { name: 'Race lanes' })

  await expect(startRace).toBeDisabled()
  await expect(program.getByText(/Generate a program/)).toBeVisible()
  await expect(lanes.getByRole('listitem')).toHaveCount(10)
  await expect(lanes.getByText('Lane 1, empty', { exact: true })).toHaveCount(1)
  await expect(
    page.getByRole('region', { name: 'Horse pool' }).getByText('20 horses'),
  ).toBeVisible()

  await header.getByRole('button', { name: 'Generate program' }).click()

  await expect(startRace).toBeEnabled()
  await expect(track.getByText('Ready to start')).toBeVisible()
  const rounds = program.locator('summary')
  await expect(rounds).toHaveCount(6)
  for (const [index, distance] of [1200, 1400, 1600, 1800, 2000, 2200].entries()) {
    const summary = rounds.nth(index)
    await expect(summary).toContainText(`Round ${index + 1} · ${distance} m`)
    await expect(summary).toContainText(index === 0 ? 'Ready' : 'Pending')
    await summary.click()

    const lineup = program.getByRole('list', { name: 'Horses in lane order' })
    const participants = lineup.getByRole('listitem')
    await expect(participants).toHaveCount(10)
    const names = new Set<string>()
    for (const [laneIndex, row] of (await participants.allTextContents()).entries()) {
      const lane = laneIndex + 1
      const name = row.match(new RegExp(`^\\s*Lane\\s*${lane}\\s*([^·]+)·`))?.[1]?.trim()
      if (!name) throw new Error(`Expected a named horse in round ${index + 1}, lane ${lane}`)
      names.add(name)
      if (index === 0) {
        await expect(
          lanes.getByText(`Lane ${lane}, ${name}, at the start`, { exact: true }),
        ).toHaveCount(1)
      }
    }
    expect(names.size).toBe(10)
    await summary.click()
  }
})

test('runs a real-time race day at 3× and starts over with the same horse pool and speed', async ({
  page,
}) => {
  test.setTimeout(90_000)
  const header = page.getByRole('banner')
  const generate = header.getByRole('button', { name: 'Generate program' })
  const speed = header.getByRole('button', { name: '3 times playback speed' })
  const track = page.getByRole('region', { name: 'Race track' })
  const announcement = track.getByRole('status')
  const results = page.getByRole('region', { name: 'Results', exact: true })
  const horsePool = page.getByRole('region', { name: 'Horse pool' })
  const horses = horsePool.getByRole('listitem')
  await expect(horses).toHaveCount(20)
  const initialHorses = await horses.allTextContents()

  await generate.click()
  await speed.click()
  await header.getByRole('button', { name: 'Start race', exact: true }).click()

  await expect(generate).toBeDisabled()
  for (const round of [1, 2, 3, 4, 5, 6]) {
    await expect(announcement).toHaveText(
      new RegExp(`^Round ${round}, .*Starting in three seconds\\.$`),
      { timeout: 20_000 },
    )
    await expect(announcement).toHaveText(`Round ${round} started.`, { timeout: 6_000 })
  }

  const raceAgain = track.getByRole('button', { name: 'Race again' })
  await expect(raceAgain).toBeVisible({ timeout: 20_000 })
  await expect(announcement).toHaveText('Race day complete. All results are ready.')
  await expect(
    horsePool.getByRole('list', { name: 'Final standings' }).getByRole('listitem'),
  ).toHaveCount(10)
  await expect(results.getByText('6 of 6', { exact: true })).toBeVisible()

  const finishedRounds = results.locator('summary')
  await expect(finishedRounds).toHaveCount(6)
  for (const summary of await finishedRounds.all()) {
    await summary.click()
  }
  await expect(results.locator('time:visible')).toHaveCount(60)

  await raceAgain.focus()
  await page.keyboard.press('Enter')

  const trackGenerate = track.getByRole('button', { name: 'Generate program' })
  await expect(trackGenerate).toBeFocused()
  await expect(results.getByText('0 of 6', { exact: true })).toBeVisible()
  await expect(results.locator('time')).toHaveCount(0)
  await expect(speed).toHaveAttribute('aria-pressed', 'true')
  await expect(horses).toHaveText(initialHorses)

  await trackGenerate.click()
  await expect(track.getByRole('heading', { name: 'Race track' })).toBeFocused()
  await header.getByRole('button', { name: 'Start race', exact: true }).click()
  await expect(announcement).toHaveText(/Round 1, .*Starting in three seconds\./)
  await expect(results.getByText('0 of 6', { exact: true })).toBeVisible()
})

test('freezes active progress while paused and continues after changing speed', async ({
  page,
}) => {
  const clockStart = new Date('2026-01-01T00:00:00Z')
  await page.clock.install({ time: clockStart })
  await page.clock.pauseAt(new Date(clockStart.getTime() + 60_000))
  const header = page.getByRole('banner')
  const track = page.getByRole('region', { name: 'Race track' })
  const lanes = track.getByRole('list', { name: 'Race lanes' }).getByRole('listitem')
  const announcement = track.getByRole('status')
  const pause = header.getByRole('button', { name: 'Pause', exact: true })

  await header.getByRole('button', { name: 'Generate program' }).click()
  await header.getByRole('button', { name: 'Start race', exact: true }).click()
  await page.clock.runFor(3800)
  await expect(lanes.first()).toContainText(/[1-9]\d*% complete/)
  await pause.click()

  await expect(announcement).toHaveText('Race paused.')
  const pausedLanes = await lanes.allTextContents()

  const fast = header.getByRole('button', { name: '3 times playback speed' })
  await fast.click()
  await expect(fast).toHaveAttribute('aria-pressed', 'true')
  await page.clock.runFor(1500)
  await expect(lanes).toHaveText(pausedLanes)

  await header.getByRole('button', { name: 'Resume', exact: true }).click()
  await expect(announcement).toHaveText('Race resumed.')
  await page.clock.runFor(500)

  await expect(pause).toBeEnabled()
  await expect(lanes.first()).not.toHaveText(pausedLanes[0] ?? '')
})
