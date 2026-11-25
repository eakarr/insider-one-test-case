import { HORSE_IDENTITIES } from '@/constants/horse'
import type { IHorse } from '@/models/race'

// Fixed conditions for development previews.

const mockConditions = {
  1: 86,
  2: 72,
  3: 91,
  4: 64,
  5: 78,
  6: 83,
  7: 95,
  8: 69,
  9: 88,
  10: 74,
  11: 81,
  12: 67,
  13: 92,
  14: 76,
  15: 84,
  16: 71,
  17: 89,
  18: 79,
  19: 66,
  20: 87,
} satisfies Record<(typeof HORSE_IDENTITIES)[number]['id'], number>

export const mockHorses: readonly IHorse[] = HORSE_IDENTITIES.map((identity) => ({
  ...identity,
  condition: mockConditions[identity.id],
}))
