import { describe, expect, it } from 'vitest'

import { calculateLiveStandings, calculateRaceResults } from '@/domain/race-results'

describe('calculateLiveStandings', () => {
  it('orders finishers by time and active horses by progress, breaking both ties by lane', () => {
    const participants = [
      { lane: 8, progress: 0.8 },
      { lane: 1, progress: 0.5 },
      { lane: 4, progress: 1, finishTimeMs: 6051.75 },
      { lane: 5, progress: 1, finishTimeMs: 6050.25 },
      { lane: 3, progress: 1, finishTimeMs: 6051.75 },
      { lane: 7, progress: 0.8 },
    ]
    const inputOrder = participants.map(({ lane }) => lane)

    const standings = calculateLiveStandings({ roundNumber: 1, participants })

    expect(standings.map(({ lane }) => lane)).toEqual([5, 3, 4, 7, 8, 1])
    expect(standings.map(({ position }) => position)).toEqual([1, 2, 3, 4, 5, 6])
    expect(participants.map(({ lane }) => lane)).toEqual(inputOrder)
  })
})

describe('calculateRaceResults', () => {
  it('preserves precise finish times and uses lane order when finish times tie', () => {
    const participants = Array.from({ length: 10 }, (_, index) => {
      const lane = 10 - index
      return { lane, progress: 1, finishTimeMs: lane === 10 ? 6999.25 : 7000.125 }
    })

    const result = calculateRaceResults({ roundNumber: 4, participants })

    expect(result?.roundNumber).toBe(4)
    expect(result?.finishers).toEqual(
      [10, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((lane, index) => ({
        lane,
        position: index + 1,
        finishTimeMs: lane === 10 ? 6999.25 : 7000.125,
      })),
    )
  })

  it('waits for all ten lanes and a finish time for every participant', () => {
    const nineFinishers = Array.from({ length: 9 }, (_, index) => ({
      lane: index + 1,
      progress: 1,
      finishTimeMs: 7000,
    }))

    expect(calculateRaceResults({ roundNumber: 1, participants: nineFinishers })).toBeUndefined()
    expect(
      calculateRaceResults({
        roundNumber: 1,
        participants: [...nineFinishers, { lane: 10, progress: 1 }],
      }),
    ).toBeUndefined()
  })

  it('rejects duplicate finisher lanes even if all ten entries have finish times', () => {
    const participants = Array.from({ length: 10 }, (_, index) => ({
      lane: index === 9 ? 1 : index + 1,
      progress: 1,
      finishTimeMs: 7000,
    }))

    expect(() => calculateRaceResults({ roundNumber: 1, participants })).toThrow(
      'Invalid or duplicate finisher lane',
    )
  })

  it.each([0, -1, Number.POSITIVE_INFINITY, Number.NaN])(
    'rejects an invalid finish time of %s ms',
    (finishTimeMs) => {
      const participants = Array.from({ length: 10 }, (_, index) => ({
        lane: index + 1,
        progress: 1,
        finishTimeMs,
      }))

      expect(() => calculateRaceResults({ roundNumber: 1, participants })).toThrow(
        'Invalid finish time',
      )
    },
  )
})
