import { HORSE_CONDITION_RANGE } from '@/constants/horse'
import {
  PARTICIPANTS_PER_RACE,
  RACE_DISTANCES,
  RACE_SIMULATION,
  TOTAL_RACE_ROUNDS,
} from '@/constants/race'
import type { TRandomSource } from '@/helpers/random'
import type { IRaceParticipantProgress, IRaceScheduledRound, TRaceDistance } from '@/models/race'

interface IRaceSpeedSegment {
  readonly speedMps: number
  readonly endDistanceMeters: number
  readonly endTimeMs: number
}

interface IRacePerformanceProfile {
  readonly lane: number
  readonly segments: readonly IRaceSpeedSegment[]
}

export interface IPreparedRaceRound {
  readonly roundNumber: number
  readonly distance: TRaceDistance
  readonly profiles: readonly IRacePerformanceProfile[]
}

export interface IRaceRoundProgress {
  readonly roundNumber: number
  readonly participants: readonly IRaceParticipantProgress[]
}

const { baseSpeedMps, conditionInfluence, roundVariation, segmentVariation, segmentsPerRound } =
  RACE_SIMULATION
const { min: minCondition, max: maxCondition } = HORSE_CONDITION_RANGE

function drawMultiplier(random: TRandomSource, variation: number): number {
  const draw = random()
  if (!(draw >= 0 && draw < 1)) throw new RangeError('Race random draw must be in [0, 1)')
  return 1 + variation * (2 * draw - 1)
}

export function prepareRaceRound(
  round: IRaceScheduledRound,
  random: TRandomSource,
): IPreparedRaceRound {
  if (
    !Number.isInteger(round.roundNumber) ||
    round.roundNumber < 1 ||
    round.roundNumber > TOTAL_RACE_ROUNDS ||
    RACE_DISTANCES[round.roundNumber - 1] !== round.distance
  ) {
    throw new RangeError('Invalid race round number or distance')
  }
  if (round.participants.length !== PARTICIPANTS_PER_RACE) {
    throw new RangeError(`Expected ${PARTICIPANTS_PER_RACE} race participants`)
  }

  const lanes = new Set<number>()
  const horseIds = new Set<number>()
  for (const { lane, horse } of round.participants) {
    if (!Number.isInteger(lane) || lane < 1 || lane > PARTICIPANTS_PER_RACE || lanes.has(lane)) {
      throw new RangeError(`Invalid or duplicate race lane ${lane}`)
    }
    if (horseIds.has(horse.id)) throw new RangeError(`Duplicate race horse ID ${horse.id}`)
    if (
      !Number.isInteger(horse.condition) ||
      horse.condition < minCondition ||
      horse.condition > maxCondition
    ) {
      throw new RangeError(`Invalid horse condition in lane ${lane}`)
    }
    lanes.add(lane)
    horseIds.add(horse.id)
  }

  const profiles = round.participants.map(({ lane, horse }) => {
    const condition = (horse.condition - minCondition) / (maxCondition - minCondition)
    const conditionFactor = 1 + conditionInfluence * (2 * condition - 1)
    const roundSpeedMps = baseSpeedMps * conditionFactor * drawMultiplier(random, roundVariation)
    let distanceMeters = 0
    let elapsedMs = 0

    const segments = Array.from({ length: segmentsPerRound }, (_, index) => {
      const speedMps = roundSpeedMps * drawMultiplier(random, segmentVariation)
      const endDistanceMeters = (round.distance * (index + 1)) / segmentsPerRound
      elapsedMs += ((endDistanceMeters - distanceMeters) / speedMps) * 1000
      distanceMeters = endDistanceMeters

      return { speedMps, endDistanceMeters, endTimeMs: elapsedMs }
    })

    return { lane, segments }
  })

  return { roundNumber: round.roundNumber, distance: round.distance, profiles }
}

function calculateParticipantProgress(
  profile: IRacePerformanceProfile,
  distance: TRaceDistance,
  elapsedMs: number,
): IRaceParticipantProgress {
  let startTimeMs = 0
  let startDistanceMeters = 0

  for (const segment of profile.segments) {
    if (elapsedMs < segment.endTimeMs) {
      const distanceMeters = Math.min(
        segment.endDistanceMeters,
        startDistanceMeters + ((elapsedMs - startTimeMs) / 1000) * segment.speedMps,
      )
      // Keep a sample just before the finish below 1 even if distance rounds up.
      return {
        lane: profile.lane,
        progress: Math.min(distanceMeters / distance, 1 - Number.EPSILON / 2),
      }
    }
    startTimeMs = segment.endTimeMs
    startDistanceMeters = segment.endDistanceMeters
  }

  return { lane: profile.lane, progress: 1, finishTimeMs: startTimeMs }
}

export function calculateRaceProgress(
  round: IPreparedRaceRound,
  elapsedMs: number,
): IRaceRoundProgress {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
    throw new RangeError('Elapsed race time must be finite and non-negative')
  }

  return {
    roundNumber: round.roundNumber,
    participants: round.profiles.map((profile) =>
      calculateParticipantProgress(profile, round.distance, elapsedMs),
    ),
  }
}
