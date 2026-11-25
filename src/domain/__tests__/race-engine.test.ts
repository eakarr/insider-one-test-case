import { describe, expect, it } from 'vitest'

import { generateHorses } from '@/domain/generate-horses'
import { generateRaceProgram } from '@/domain/generate-race-program'
import { calculateRaceProgress, prepareRaceRound } from '@/domain/race-engine'
import { calculateRaceResults } from '@/domain/race-results'
import { createSeededRandom } from '@/helpers/random'
import type { IRaceScheduledRound } from '@/models/race'

function createRound(): IRaceScheduledRound {
  const horses = generateHorses(createSeededRandom(42)).slice(0, 10)

  return {
    roundNumber: 1,
    distance: 1200,
    participants: horses.map((horse, index) => ({
      lane: index + 1,
      horse: { ...horse, condition: 50 },
    })),
  }
}

describe('race simulation', () => {
  it('starts at zero and interpolates progress across a distance-segment boundary', () => {
    const round = createRound()
    const draws = [0.5, 0.5, 0.75]
    const prepared = prepareRaceRound(round, () => draws.shift() ?? 0.5)
    const firstSpeed = 190 * (1 + 0.12 * (2 * (49 / 99) - 1))
    const firstSegmentEndMs = (400 / firstSpeed) * 1000
    const next100MetersMs = (100 / (firstSpeed * 1.09)) * 1000

    const start = calculateRaceProgress(prepared, 0)
    const atBoundary = calculateRaceProgress(prepared, firstSegmentEndMs)
    const afterBoundary = calculateRaceProgress(prepared, firstSegmentEndMs + next100MetersMs)

    expect(start.participants).toEqual(
      round.participants.map(({ lane }) => ({ lane, progress: 0 })),
    )
    expect(atBoundary.participants[0]?.progress).toBeCloseTo(1 / 3, 10)
    expect(afterBoundary.participants[0]?.progress).toBeCloseTo(5 / 12, 10)
  })

  it('gives the better-conditioned horse an earlier finish with identical random draws', () => {
    const round = createRound()
    const participants = round.participants.map((participant) => ({
      ...participant,
      horse: { ...participant.horse, condition: participant.lane === 1 ? 100 : 1 },
    }))
    const prepared = prepareRaceRound({ ...round, participants }, () => 0.5)
    const expectedWinnerTime = (1200 / (190 * 1.12)) * 1000
    const expectedLastTime = (1200 / (190 * 0.88)) * 1000
    const completed = calculateRaceProgress(prepared, 10_000)
    const winnerTime = completed.participants[0]?.finishTimeMs
    if (winnerTime === undefined) throw new Error('The test round should be complete')

    const beforeFinish = calculateRaceProgress(prepared, winnerTime - 0.001)
    const atFinish = calculateRaceProgress(prepared, winnerTime)
    const result = calculateRaceResults(completed)

    expect(beforeFinish.participants[0]?.progress).toBeLessThan(1)
    expect(beforeFinish.participants[0]?.finishTimeMs).toBeUndefined()
    expect(atFinish.participants[0]).toEqual({ lane: 1, progress: 1, finishTimeMs: winnerTime })
    expect(atFinish.participants[1]?.progress).toBeLessThan(1)
    expect(calculateRaceResults(atFinish)).toBeUndefined()
    expect(result?.finishers[0]).toEqual({ lane: 1, position: 1, finishTimeMs: winnerTime })
    expect(winnerTime).toBeCloseTo(expectedWinnerTime, 8)
    expect(result?.finishers.at(-1)?.finishTimeMs).toBeCloseTo(expectedLastTime, 8)
  })

  it('allows a horse to overtake an early leader when segment speeds change', () => {
    // Each of the first two horses receives one neutral round draw and three segment draws.
    const draws = [0.5, 0.99, 0, 0, 0.5, 0, 0.99, 0.99]
    const prepared = prepareRaceRound(createRound(), () => draws.shift() ?? 0.5)

    const early = calculateRaceProgress(prepared, 500)
    const later = calculateRaceProgress(prepared, 5_500)

    expect(early.participants[0]?.progress).toBeGreaterThan(early.participants[1]?.progress ?? 0)
    expect(later.participants[1]?.progress).toBeGreaterThan(later.participants[0]?.progress ?? 0)
  })

  it('repeats all six round results regardless of earlier progress samples', () => {
    const pool = generateHorses(createSeededRandom(42))
    const program = generateRaceProgram(pool, createSeededRandom(17))
    const performance = createSeededRandom(73)
    const repeatedPerformance = createSeededRandom(73)

    const results = program.rounds.map((round) => {
      const prepared = prepareRaceRound(round, performance)
      calculateRaceProgress(prepared, 1000)
      calculateRaceProgress(prepared, 2500)
      return calculateRaceResults(calculateRaceProgress(prepared, 30_000))
    })
    const repeated = program.rounds.map((round) => {
      const prepared = prepareRaceRound(round, repeatedPerformance)
      return calculateRaceResults(calculateRaceProgress(prepared, 35_000))
    })

    expect(results.flatMap((result) => result?.finishers ?? [])).toHaveLength(60)
    expect(repeated).toEqual(results)
  })
})

describe('race simulation input boundaries', () => {
  it('rejects a round whose distance does not match its number', () => {
    const round = { ...createRound(), distance: 1400 } as const

    expect(() => prepareRaceRound(round, () => 0.5)).toThrow(
      'Invalid race round number or distance',
    )
  })

  it('rejects a round with an incomplete field', () => {
    const round = createRound()
    const incomplete = { ...round, participants: round.participants.slice(1) }

    expect(() => prepareRaceRound(incomplete, () => 0.5)).toThrow(RangeError)
  })

  it.each([0, 2, 10.5])('rejects an invalid or duplicate lane of %s', (lane) => {
    const round = createRound()
    const participants = round.participants.map((participant) =>
      participant.lane === 1 ? { ...participant, lane } : participant,
    )

    expect(() => prepareRaceRound({ ...round, participants }, () => 0.5)).toThrow(
      'Invalid or duplicate race lane',
    )
  })

  it('rejects the same horse assigned to two lanes', () => {
    const round = createRound()
    const [first, second, ...rest] = round.participants
    if (!first || !second) throw new Error('The test round needs two participants')
    const participants = [first, { ...second, horse: first.horse }, ...rest]

    expect(() => prepareRaceRound({ ...round, participants }, () => 0.5)).toThrow(
      'Duplicate race horse ID',
    )
  })

  it.each([0, 50.5, 101])('rejects a horse condition of %s', (condition) => {
    const round = createRound()
    const participants = round.participants.map(({ lane, horse }) => ({
      lane,
      horse: { ...horse, condition },
    }))

    expect(() => prepareRaceRound({ ...round, participants }, () => 0.5)).toThrow(
      'Invalid horse condition',
    )
  })

  it('rejects a random draw outside the half-open interval', () => {
    expect(() => prepareRaceRound(createRound(), () => 1)).toThrow(RangeError)
  })

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])('rejects a sample at %s ms', (elapsedMs) => {
    const prepared = prepareRaceRound(createRound(), () => 0.5)

    expect(() => calculateRaceProgress(prepared, elapsedMs)).toThrow(RangeError)
  })
})
