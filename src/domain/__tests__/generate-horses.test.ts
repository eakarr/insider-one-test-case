import { expect, it } from 'vitest'

import { generateHorses } from '@/domain/generate-horses'
import { createSeededRandom } from '@/helpers/random'

it('generates 20 distinct horses with integer conditions from 1 through 100', () => {
  const horses = generateHorses(createSeededRandom(42))

  expect(horses).toHaveLength(20)
  expect(new Set(horses.map(({ id }) => id)).size).toBe(20)
  expect(new Set(horses.map(({ name }) => name)).size).toBe(20)
  expect(new Set(horses.map(({ color }) => color)).size).toBe(20)
  expect(
    horses.every(
      ({ condition }) => Number.isInteger(condition) && condition >= 1 && condition <= 100,
    ),
  ).toBe(true)
})

it.each([
  [0, 1],
  [(2 ** 32 - 1) / 2 ** 32, 100],
])('includes the condition endpoint %s → %s', (draw, condition) => {
  const horses = generateHorses(() => draw)

  expect(new Set(horses.map((horse) => horse.condition))).toEqual(new Set([condition]))
})

it('generates the same horse pool from the same seed', () => {
  const first = generateHorses(createSeededRandom(713))
  const repeated = generateHorses(createSeededRandom(713))

  expect(repeated).toEqual(first)
})
