export const PARTICIPANTS_PER_RACE = 10
export const RACE_DISTANCES = [1200, 1400, 1600, 1800, 2000, 2200] as const
export const TOTAL_RACE_ROUNDS = RACE_DISTANCES.length
export const RACE_PLAYBACK_SPEEDS = [1, 2, 3] as const
export const RACE_COUNTDOWN_MS = 3000
export const RACE_INTER_ROUND_DELAY_MS = 1500

// Accelerated simulation rates, expressed in meters per simulation second.
export const RACE_SIMULATION = {
  baseSpeedMps: 190,
  conditionInfluence: 0.12,
  roundVariation: 0.18,
  segmentVariation: 0.18,
  segmentsPerRound: 3,
} as const
