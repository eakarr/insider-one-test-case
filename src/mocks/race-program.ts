import { PARTICIPANTS_PER_RACE, RACE_DISTANCES } from '@/constants/race'
import type { IRaceRoundPresentation } from '@/models/race'

import { mockHorses } from './race'

// TODO(Phase 3): Replace the fixed program with the race domain's selection logic.
const fields = [
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  [1, 3, 5, 7, 9, 11, 13, 15, 17, 19],
  [2, 4, 6, 8, 10, 12, 14, 16, 18, 20],
  [1, 4, 6, 8, 10, 13, 15, 17, 18, 20],
  [2, 3, 5, 7, 9, 11, 12, 14, 16, 19],
] as const

const horsesById = new Map<number, (typeof mockHorses)[number]>(
  mockHorses.map((horse) => [horse.id, horse]),
)

export function createMockRaceProgram(): readonly IRaceRoundPresentation[] {
  return RACE_DISTANCES.map((distance, index) => {
    const roundNumber = index + 1
    const field = fields[index]
    if (field?.length !== PARTICIPANTS_PER_RACE || new Set(field).size !== PARTICIPANTS_PER_RACE) {
      throw new Error(
        `Expected ${PARTICIPANTS_PER_RACE} unique fixture horses in round ${roundNumber}`,
      )
    }

    const participants = field.map((id, lane) => {
      const horse = horsesById.get(id)
      if (!horse) throw new Error(`Unknown fixture horse ${id}`)
      return { lane: lane + 1, horse, progress: 0 }
    })

    return {
      id: roundNumber,
      roundNumber,
      distance,
      status: 'scheduled',
      participants,
      results: [],
    }
  })
}
