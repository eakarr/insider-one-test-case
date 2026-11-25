import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'

import { RACE_COUNTDOWN_MS, RACE_INTER_ROUND_DELAY_MS, TOTAL_RACE_ROUNDS } from '@/constants/race'
import { useRaceStore } from '@/stores/race'

type TRaceStore = ReturnType<typeof useRaceStore>

// Larger than the longest round under the configured race speeds.
const ROUND_BUDGET_MS = 30_000

function createSeededRace(): TRaceStore {
  const race = useRaceStore(createPinia())
  expect(race.initialize(42)).toBe(true)
  return race
}

function startCountdown(race: TRaceStore) {
  expect(race.generateProgram()).toBe(true)
  expect(race.startRace()).toBe(true)
}

function completeRaceDay(race: TRaceStore, runningSteps: readonly number[] = [ROUND_BUDGET_MS]) {
  for (let round = 1; round <= TOTAL_RACE_ROUNDS; round++) {
    expect(race.state).toMatchObject({
      status: 'countdown',
      roundNumber: round,
      remainingMs: RACE_COUNTDOWN_MS,
    })
    expect(race.advanceTime(RACE_COUNTDOWN_MS, race.state)).toBe(0)
    for (const deltaMs of runningSteps) {
      race.advanceTime(deltaMs, race.state)
    }
    if (round < TOTAL_RACE_ROUNDS) {
      expect(race.advanceTime(RACE_INTER_ROUND_DELAY_MS, race.state)).toBe(0)
    }
  }
  expect(race.status).toBe('day-complete')
}

describe('race setup', () => {
  it('starts idle with a horse pool, no active field, and only generation available', () => {
    const race = useRaceStore(createPinia())
    const idle = race.state

    expect(race.status).toBe('idle')
    expect(race.horses).toHaveLength(20)
    expect(race.program).toBeUndefined()
    expect(race.currentRound).toBeUndefined()
    expect(race.participants).toEqual([])
    expect(race.standings).toEqual([])
    expect(race.results).toEqual([])
    expect(race.availableActions).toEqual({
      canGenerateProgram: true,
      canStartRace: false,
      canPause: false,
      canResume: false,
      canRaceAgain: false,
    })
    expect(race.startRace()).toBe(false)
    expect(race.pause()).toBe(false)
    expect(race.resume()).toBe(false)
    expect(race.raceAgain()).toBe(false)
    expect(race.advanceTime(1, idle)).toBeUndefined()
    expect(race.state).toBe(idle)
  })

  it('allows a seed once before generation and reproduces the same pool and schedule', () => {
    const race = createSeededRace()
    const repeated = createSeededRace()
    const horsePool = race.horses

    expect(race.initialize(43)).toBe(false)
    expect(race.horses).toBe(horsePool)
    expect(repeated.horses).toEqual(horsePool)

    expect(race.generateProgram()).toBe(true)
    expect(repeated.generateProgram()).toBe(true)
    expect(repeated.program).toEqual(race.program)
  })

  it('replaces a ready program with a fresh schedule while keeping the original horse pool', () => {
    const race = createSeededRace()
    const horsePool = race.horses
    expect(race.generateProgram()).toBe(true)
    const previousProgram = race.program

    expect(race.generateProgram()).toBe(true)

    expect(race.status).toBe('ready')
    expect(race.program).not.toEqual(previousProgram)
    expect(race.horses).toBe(horsePool)
    expect(race.currentRound).toBe(race.program?.rounds[0])
    expect(race.results).toEqual([])
    expect(race.participants).toHaveLength(10)
    expect(race.participants.every(({ progress }) => progress === 0)).toBe(true)
    expect(race.availableActions).toMatchObject({ canGenerateProgram: true, canStartRace: true })
    expect(race.pause()).toBe(false)
    expect(race.raceAgain()).toBe(false)
    expect(race.advanceTime(1, race.state)).toBeUndefined()
  })

  it('locks initial seeding when a program is generated with the default seed', () => {
    const race = useRaceStore(createPinia())
    expect(race.generateProgram()).toBe(true)
    const ready = race.state
    const horsePool = race.horses

    expect(race.initialize(42)).toBe(false)

    expect(race.state).toBe(ready)
    expect(race.horses).toBe(horsePool)
  })
})

describe('race timing', () => {
  it('holds the field at the gate until the last countdown millisecond', () => {
    const race = createSeededRace()
    startCountdown(race)
    const countdown = race.state

    expect(countdown).toMatchObject({
      status: 'countdown',
      roundNumber: 1,
      remainingMs: RACE_COUNTDOWN_MS,
    })
    expect(race.startRace()).toBe(false)
    expect(race.generateProgram()).toBe(false)
    expect(race.resume()).toBe(false)
    expect(race.raceAgain()).toBe(false)
    expect(race.availableActions).toMatchObject({ canPause: true, canResume: false })
    expect(race.advanceTime(RACE_COUNTDOWN_MS - 1, countdown)).toBe(0)
    expect(race.state).toMatchObject({ status: 'countdown', remainingMs: 1 })
    expect(race.participants.every(({ progress }) => progress === 0)).toBe(true)

    expect(race.advanceTime(1, race.state)).toBe(0)
    expect(race.state).toMatchObject({ status: 'running', roundNumber: 1, elapsedMs: 0 })
    expect(race.results).toEqual([])
  })

  it('returns countdown overshoot without spending it in the running phase', () => {
    const race = createSeededRace()
    startCountdown(race)

    const unusedMs = race.advanceTime(RACE_COUNTDOWN_MS + 200, race.state)

    expect(unusedMs).toBe(200)
    expect(race.state).toMatchObject({ status: 'running', elapsedMs: 0 })
    expect(race.participants.every(({ progress }) => progress === 0)).toBe(true)
  })

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects a delta of %s ms without changing state',
    (deltaMs) => {
      const race = createSeededRace()
      startCountdown(race)
      const countdown = race.state

      expect(race.advanceTime(deltaMs, countdown)).toBeUndefined()
      expect(race.state).toBe(countdown)
    },
  )

  it('rejects a previously accepted snapshot after the countdown advances', () => {
    const race = createSeededRace()
    startCountdown(race)
    const initial = race.state
    expect(race.advanceTime(250, initial)).toBe(0)
    const updated = race.state

    expect(race.advanceTime(100, initial)).toBeUndefined()

    expect(race.state).toBe(updated)
    expect(race.state).toMatchObject({ remainingMs: RACE_COUNTDOWN_MS - 250 })
  })

  it('records one completed round, keeps its field visible, and starts the next full countdown', () => {
    const race = createSeededRace()
    startCountdown(race)
    expect(race.advanceTime(RACE_COUNTDOWN_MS, race.state)).toBe(0)
    const runningSampleMs = 1250
    expect(race.advanceTime(runningSampleMs, race.state)).toBe(0)
    const running = race.state
    expect(running).toMatchObject({ status: 'running', elapsedMs: runningSampleMs })
    expect(race.participants.every(({ progress }) => progress > 0 && progress < 1)).toBe(true)
    expect(race.results).toEqual([])

    const unusedMs = race.advanceTime(ROUND_BUDGET_MS, running)
    const result = race.results[0]
    const lastFinish = result?.finishers.at(-1)
    if (!result || !lastFinish) throw new Error('Expected a recorded round')

    expect(unusedMs).toBeCloseTo(runningSampleMs + ROUND_BUDGET_MS - lastFinish.finishTimeMs)
    expect(race.state).toMatchObject({
      status: 'round-complete',
      remainingMs: RACE_INTER_ROUND_DELAY_MS,
    })
    expect(race.currentRound?.roundNumber).toBe(1)
    expect(race.standings.map(({ lane }) => lane)).toEqual(result.finishers.map(({ lane }) => lane))
    expect(race.participants.every(({ progress }) => progress === 1)).toBe(true)
    expect(race.advanceTime(ROUND_BUDGET_MS, running)).toBeUndefined()
    expect(race.results).toEqual([result])

    expect(race.advanceTime(RACE_INTER_ROUND_DELAY_MS - 1, race.state)).toBe(0)
    expect(race.state).toMatchObject({ status: 'round-complete', remainingMs: 1 })
    expect(race.advanceTime(201, race.state)).toBe(200)
    expect(race.state).toMatchObject({
      status: 'countdown',
      roundNumber: 2,
      remainingMs: RACE_COUNTDOWN_MS,
    })
    expect(race.currentRound?.roundNumber).toBe(2)
    expect(race.participants.every(({ progress }) => progress === 0)).toBe(true)
    expect(race.results).toEqual([result])
  })
})

describe('pause and resume', () => {
  it.each([
    ['countdown', [1200]],
    ['running', [RACE_COUNTDOWN_MS, 1250]],
    ['round-complete', [RACE_COUNTDOWN_MS, ROUND_BUDGET_MS, 400]],
  ] as const)('freezes and resumes the %s snapshot', (phase, steps) => {
    const race = createSeededRace()
    startCountdown(race)
    for (const deltaMs of steps) {
      race.advanceTime(deltaMs, race.state)
    }
    const phaseBeforePause = race.state
    const progress = race.participants
    const standings = race.standings
    const results = race.results
    expect(race.status).toBe(phase)

    expect(race.pause()).toBe(true)
    const paused = race.state

    expect(paused).toMatchObject({ status: 'paused', interrupted: { status: phase } })
    expect(race.availableActions).toEqual({
      canGenerateProgram: false,
      canStartRace: false,
      canPause: false,
      canResume: true,
      canRaceAgain: false,
    })
    expect(race.pause()).toBe(false)
    expect(race.startRace()).toBe(false)
    expect(race.generateProgram()).toBe(false)
    expect(race.raceAgain()).toBe(false)
    expect(race.advanceTime(5000, paused)).toBeUndefined()
    expect(race.state).toBe(paused)
    expect(race.participants).toEqual(progress)
    expect(race.standings).toEqual(standings)
    expect(race.results).toBe(results)

    expect(race.resume()).toBe(true)
    expect(race.state).toEqual(phaseBeforePause)
    expect(race.resume()).toBe(false)
    expect(race.advanceTime(1, phaseBeforePause)).toBeUndefined()
    expect(race.advanceTime(1, race.state)).toBe(0)
  })
})

describe('complete race days', () => {
  it('finishes six rounds, resets for Race Again, and completes a fresh day with the same pool', () => {
    const race = createSeededRace()
    const horsePool = race.horses

    startCountdown(race)
    completeRaceDay(race)
    const firstResults = race.results
    const firstProgram = race.program
    const completed = race.state

    expect(firstResults.map(({ roundNumber }) => roundNumber)).toEqual([1, 2, 3, 4, 5, 6])
    expect(firstResults.map(({ finishers }) => finishers.length)).toEqual([10, 10, 10, 10, 10, 10])
    expect(race.currentRound?.roundNumber).toBe(6)
    expect(race.availableActions).toMatchObject({ canRaceAgain: true, canPause: false })
    expect(race.startRace()).toBe(false)
    expect(race.generateProgram()).toBe(false)
    expect(race.pause()).toBe(false)
    expect(race.resume()).toBe(false)
    expect(race.advanceTime(100, completed)).toBeUndefined()
    expect(race.state).toBe(completed)

    expect(race.raceAgain()).toBe(true)
    expect(race.status).toBe('idle')
    expect(race.horses).toBe(horsePool)
    expect(race.program).toBeUndefined()
    expect(race.currentRound).toBeUndefined()
    expect(race.results).toEqual([])
    expect(race.raceAgain()).toBe(false)
    expect(race.initialize(42)).toBe(false)

    startCountdown(race)
    const nextCountdown = race.state
    expect(race.advanceTime(100, completed)).toBeUndefined()
    expect(race.state).toBe(nextCountdown)
    completeRaceDay(race)

    expect(race.program).not.toEqual(firstProgram)
    expect(race.results.flatMap(({ finishers }) => finishers)).toHaveLength(60)
    expect(race.results).not.toEqual(firstResults)
  })

  it('produces identical results when the same simulated time is split into smaller steps', () => {
    const whole = createSeededRace()
    const partitioned = createSeededRace()
    startCountdown(whole)
    startCountdown(partitioned)

    completeRaceDay(whole)
    completeRaceDay(partitioned, [300, 700, 1500, ROUND_BUDGET_MS - 2500])

    expect(partitioned.results).toEqual(whole.results)
    expect(partitioned.standings).toEqual(whole.standings)
  })
})
