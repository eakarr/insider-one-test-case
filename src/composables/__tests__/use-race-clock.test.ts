// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { createPinia, disposePinia } from 'pinia'
import { afterEach, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

import { useRaceClock } from '@/composables/use-race-clock'
import { RACE_COUNTDOWN_MS, RACE_INTER_ROUND_DELAY_MS, TOTAL_RACE_ROUNDS } from '@/constants/race'
import { useRaceStore } from '@/stores/race'

const mountedClocks = new Set<() => void>()

afterEach(() => {
  for (const dispose of mountedClocks) dispose()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function mountClock() {
  const frames = new Map<number, FrameRequestCallback>()
  let nextId = 0
  let hidden = false
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    const id = ++nextId
    frames.set(id, callback)
    return id
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id))
  const visibility = vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden)

  const pinia = createPinia()
  const race = useRaceStore(pinia)
  race.initialize(42)
  const wrapper = mount(
    defineComponent({
      setup: () => useRaceClock(race),
      render: () => null,
    }),
  )

  function dispose() {
    mountedClocks.delete(dispose)
    wrapper.unmount()
    disposePinia(pinia)
    visibility.mockRestore()
  }
  mountedClocks.add(dispose)

  function nextFrame() {
    expect(frames.size).toBe(1)
    const entry = frames.entries().next().value
    if (!entry) throw new Error('Expected one queued animation frame')
    return entry
  }

  function frame(timestamp: number) {
    const [id, callback] = nextFrame()
    frames.delete(id)
    callback(timestamp)
  }

  function setHidden(value: boolean) {
    hidden = value
    document.dispatchEvent(new Event('visibilitychange'))
  }

  function startRace() {
    expect(race.generateProgram()).toBe(true)
    expect(race.startRace()).toBe(true)
  }

  function startRunning() {
    startRace()
    expect(race.advanceTime(RACE_COUNTDOWN_MS, race.state)).toBe(0)
  }

  return {
    race,
    clock: wrapper.vm,
    frames,
    nextFrame,
    frame,
    setHidden,
    startRace,
    startRunning,
    dispose,
  }
}

it('queues one frame only after Start and caps large deltas after the baseline', () => {
  const { race, clock, frames, nextFrame, frame } = mountClock()

  expect(clock.playbackSpeed).toBe(1)
  expect(frames.size).toBe(0)
  race.generateProgram()
  expect(frames.size).toBe(0)
  race.startRace()
  const [, firstCallback] = nextFrame()

  frame(10_000)
  frame(9_990)
  firstCallback(10_020)
  expect(race.state).toMatchObject({ remainingMs: RACE_COUNTDOWN_MS })
  expect(frames.size).toBe(1)

  frame(10_025)
  expect(race.state).toMatchObject({ remainingMs: RACE_COUNTDOWN_MS - 25 })
  frame(50_000)
  expect(race.state).toMatchObject({ remainingMs: RACE_COUNTDOWN_MS - 125 })
  expect(frames.size).toBe(1)
})

it.each([1, 2, 3] as const)('scales a running frame by %s times', (speed) => {
  const { race, clock, frame, startRunning } = mountClock()
  clock.setPlaybackSpeed(speed)
  startRunning()

  frame(5000)
  frame(5040)

  expect(race.state).toMatchObject({ status: 'running', elapsedMs: 40 * speed })
})

it('applies a mid-race speed change to subsequent deltas only', () => {
  const { race, clock, frames, frame, startRunning } = mountClock()
  startRunning()
  frame(1000)
  frame(1050)

  clock.setPlaybackSpeed(3)

  expect(race.state).toMatchObject({ elapsedMs: 50 })
  expect(frames.size).toBe(1)
  frame(1090)
  expect(race.state).toMatchObject({ elapsedMs: 170 })
  clock.setPlaybackSpeed(2)
  frame(1100)
  expect(race.state).toMatchObject({ elapsedMs: 190 })
})

it('discards boundary overshoot and keeps the next phase at its full duration', () => {
  const { race, clock, frame, startRace } = mountClock()
  clock.setPlaybackSpeed(3)
  startRace()
  race.advanceTime(RACE_COUNTDOWN_MS - 20, race.state)

  frame(1000)
  frame(1100)

  expect(race.state).toMatchObject({ status: 'running', elapsedMs: 0 })
  frame(1110)
  expect(race.state).toMatchObject({ elapsedMs: 30 })
  race.advanceTime(30_000, race.state)
  race.advanceTime(RACE_INTER_ROUND_DELAY_MS - 20, race.state)
  frame(1210)
  expect(race.state).toMatchObject({
    status: 'countdown',
    roundNumber: 2,
    remainingMs: RACE_COUNTDOWN_MS,
  })
})

it('cancels on pause and rebases on resume while ignoring the cancelled callback', () => {
  const { race, frames, nextFrame, frame, startRunning } = mountClock()
  startRunning()
  frame(1000)
  frame(1030)
  const [, cancelled] = nextFrame()

  race.pause()
  const paused = race.state
  expect(frames.size).toBe(0)
  cancelled(50_000)
  expect(race.state).toBe(paused)

  race.resume()
  const resumed = race.state
  cancelled(50_010)
  expect(race.state).toBe(resumed)
  frame(50_100)
  expect(race.state).toBe(resumed)
  frame(50_120)
  expect(race.state).toMatchObject({ status: 'running', elapsedMs: 50 })
  expect(frames.size).toBe(1)
})

it('suspends while hidden, rebases on return, and leaves an explicit pause in place', () => {
  const { race, clock, frames, frame, setHidden, startRunning } = mountClock()
  startRunning()
  frame(1000)
  frame(1025)
  const background = race.state

  setHidden(true)
  expect(clock.isPageVisible).toBe(false)
  expect(frames.size).toBe(0)
  expect(race.state).toBe(background)

  setHidden(false)
  expect(clock.isPageVisible).toBe(true)
  frame(30_000)
  expect(race.state).toBe(background)
  frame(30_010)
  expect(race.state).toMatchObject({ elapsedMs: 35 })

  race.pause()
  setHidden(true)
  setHidden(false)
  expect(race.status).toBe('paused')
  expect(frames.size).toBe(0)
})

it('cancels the pending frame and removes its visibility listener when unmounted', () => {
  const added = vi.spyOn(document, 'addEventListener')
  const removed = vi.spyOn(document, 'removeEventListener')
  const { race, frames, nextFrame, startRace, dispose } = mountClock()
  const listener = added.mock.calls.find(([type]) => type === 'visibilitychange')?.[1]
  expect(listener).toBeDefined()
  startRace()
  const [, cancelled] = nextFrame()
  const running = race.state

  dispose()
  cancelled(100_000)
  document.dispatchEvent(new Event('visibilitychange'))

  expect(removed).toHaveBeenCalledWith('visibilitychange', listener)
  expect(frames.size).toBe(0)
  expect(race.state).toBe(running)
})

it('preserves countdowns, inter-round delays, and all seeded results at every speed', () => {
  function runDay(speed: 1 | 2 | 3) {
    const { race, clock, frames, frame, startRace, dispose } = mountClock()
    clock.setPlaybackSpeed(speed)
    startRace()
    let timestamp = 0
    frame(timestamp)
    const tick = () => frame((timestamp += 100))

    for (let round = 1; round <= TOTAL_RACE_ROUNDS; round++) {
      for (let elapsed = 0; elapsed < RACE_COUNTDOWN_MS - 100; elapsed += 100) tick()
      expect(race.state).toMatchObject({
        status: 'countdown',
        roundNumber: round,
        remainingMs: 100,
      })
      tick()
      expect(race.state).toMatchObject({ status: 'running', elapsedMs: 0 })
      for (let sample = 0; race.status === 'running' && sample < 300; sample++) tick()

      if (round < TOTAL_RACE_ROUNDS) {
        expect(race.state).toMatchObject({
          status: 'round-complete',
          remainingMs: RACE_INTER_ROUND_DELAY_MS,
        })
        for (let elapsed = 0; elapsed < RACE_INTER_ROUND_DELAY_MS - 100; elapsed += 100) tick()
        expect(race.state).toMatchObject({ status: 'round-complete', remainingMs: 100 })
        tick()
      }
    }

    expect(race.status).toBe('day-complete')
    expect(frames.size).toBe(0)
    const results = race.results
    dispose()
    return results
  }

  const normalResults = runDay(1)

  expect(normalResults.flatMap(({ finishers }) => finishers)).toHaveLength(60)
  expect(runDay(2)).toEqual(normalResults)
  expect(runDay(3)).toEqual(normalResults)
})
