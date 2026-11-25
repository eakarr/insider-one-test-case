import { describe, expect, it } from 'vitest'

import { createSeededRandom, randomInt } from '@/helpers/random'

// One of the 2^32 samples lies outside the equal-sized buckets for three values.
const rejectedThreeWayDraw = 0xaaaaaaaa / 2 ** 32

describe('createSeededRandom', () => {
  it.each([0, 2 ** 32 - 1])('repeats an independent stream for seed %s', (seed) => {
    const first = createSeededRandom(seed)
    const second = createSeededRandom(seed)

    const draws = Array.from({ length: 8 }, () => first())

    expect(draws.every((draw) => draw >= 0 && draw < 1)).toBe(true)
    expect(draws).toEqual(Array.from({ length: draws.length }, () => second()))
    expect(new Set(draws).size).toBeGreaterThan(1)
  })

  it('changes the stream when the seed changes', () => {
    const first = createSeededRandom(42)
    const second = createSeededRandom(43)

    expect(Array.from({ length: 8 }, () => first())).not.toEqual(
      Array.from({ length: 8 }, () => second()),
    )
  })

  it.each([-1, 1.5, 2 ** 32, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects seed %s outside the unsigned 32-bit integer range',
    (seed) => {
      expect(() => createSeededRandom(seed)).toThrow(RangeError)
    },
  )
})

describe('randomInt', () => {
  it('includes both endpoints even for the full 32-bit range', () => {
    const max = 2 ** 32 - 1

    expect(randomInt(() => 0, 0, max)).toBe(0)
    expect(randomInt(() => max / (max + 1), 0, max)).toBe(max)
  })

  it('returns an equal bound without consuming a draw', () => {
    const unexpectedDraw = () => {
      throw new Error('A single eligible integer needs no random draw')
    }

    expect(randomInt(unexpectedDraw, -4, -4)).toBe(-4)
  })

  it('redraws a sample that cannot be allocated evenly across three outcomes', () => {
    const draws = [rejectedThreeWayDraw, 0.5]

    expect(randomInt(() => draws.shift() ?? Number.NaN, -1, 1)).toBe(0)
    expect(draws).toHaveLength(0)
  })

  it('validates the next draw after rejecting a sample', () => {
    const draws = [rejectedThreeWayDraw, Number.NaN, 0.5]

    expect(() => randomInt(() => draws.shift() ?? Number.NaN, -1, 1)).toThrow(RangeError)
  })

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -0.01, 1])('rejects a draw of %s', (draw) => {
    expect(() => randomInt(() => draw, 1, 100)).toThrow(RangeError)
  })

  it.each([
    [2, 1],
    [0.5, 2],
    [0, Number.MAX_SAFE_INTEGER + 1],
    [0, 2 ** 32],
  ])('rejects invalid bounds [%s, %s]', (min, max) => {
    expect(() => randomInt(() => 0.5, min, max)).toThrow(RangeError)
  })
})
