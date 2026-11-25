import { HORSE_CONDITION_RANGE, HORSE_IDENTITIES } from '@/constants/horse'
import { randomInt, type TRandomSource } from '@/helpers/random'
import type { TRaceHorse } from '@/models/horse'

const { min, max } = HORSE_CONDITION_RANGE

export function generateHorses(random: TRandomSource): readonly TRaceHorse[] {
  return HORSE_IDENTITIES.map(({ id, name, color }) => ({
    id,
    name,
    color,
    condition: randomInt(random, min, max),
  }))
}
