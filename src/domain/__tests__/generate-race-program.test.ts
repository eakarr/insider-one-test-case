import { expect, it } from 'vitest'

import { generateHorses } from '@/domain/generate-horses'
import { generateRaceProgram } from '@/domain/generate-race-program'
import { createSeededRandom } from '@/helpers/random'

it('schedules six ordered rounds using ten distinct horses from the original pool in each', () => {
  const pool = Object.freeze(generateHorses(createSeededRandom(42)))

  const { rounds } = generateRaceProgram(pool, createSeededRandom(73))

  expect(rounds.map(({ distance }) => distance)).toEqual([1200, 1400, 1600, 1800, 2000, 2200])
  expect(rounds.map(({ roundNumber }) => roundNumber)).toEqual([1, 2, 3, 4, 5, 6])
  for (const { participants } of rounds) {
    expect(participants.map(({ lane }) => lane)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(new Set(participants.map(({ horse }) => horse.id)).size).toBe(10)
    for (const { horse } of participants) {
      expect(pool.find(({ id }) => id === horse.id)).toBe(horse)
    }
  }
})

it('repeats the program when the same pool and seed are used', () => {
  const pool = generateHorses(createSeededRandom(10))

  const first = generateRaceProgram(pool, createSeededRandom(29))
  const repeated = generateRaceProgram(pool, createSeededRandom(29))

  expect(repeated).toEqual(first)
})

it('rejects a pool with fewer than 20 horses', () => {
  const pool = generateHorses(createSeededRandom(1)).slice(0, 19)

  expect(() => generateRaceProgram(pool, createSeededRandom(2))).toThrow(RangeError)
})

it('rejects a full pool containing duplicate horse IDs', () => {
  const pool = generateHorses(createSeededRandom(1))
  const duplicate = [...pool.slice(1), ...pool.slice(1, 2)]

  expect(() => generateRaceProgram(duplicate, createSeededRandom(2))).toThrow(
    'Horse IDs must be unique',
  )
})
