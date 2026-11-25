import { HORSE_POOL_SIZE } from '@/constants/horse'
import { PARTICIPANTS_PER_RACE, RACE_DISTANCES } from '@/constants/race'
import { randomInt, type TRandomSource } from '@/helpers/random'
import type { TRaceHorse } from '@/models/horse'
import type { IRaceProgram } from '@/models/race'

export function generateRaceProgram(
  horses: readonly TRaceHorse[],
  random: TRandomSource,
): IRaceProgram {
  if (horses.length !== HORSE_POOL_SIZE) {
    throw new RangeError(`Expected a pool of ${HORSE_POOL_SIZE} horses`)
  }
  if (new Set(horses.map(({ id }) => id)).size !== horses.length) {
    throw new RangeError('Horse IDs must be unique')
  }

  const rounds = RACE_DISTANCES.map((distance, roundIndex) => {
    const candidates = [...horses]
    const participants = Array.from({ length: PARTICIPANTS_PER_RACE }, (_, index) => {
      const selectedIndex = randomInt(random, index, candidates.length - 1)
      const first = candidates[index]
      const horse = candidates[selectedIndex]
      if (!first || !horse) throw new RangeError('Invalid horse selection index')

      candidates[index] = horse
      candidates[selectedIndex] = first
      return { lane: index + 1, horse }
    })

    return { roundNumber: roundIndex + 1, distance, participants }
  })

  return { rounds }
}
