import { PARTICIPANTS_PER_RACE } from '@/constants/race'
import type { IRaceFinisher, IRaceParticipantProgress, IRaceRoundResult } from '@/models/race'

import type { IRaceRoundProgress } from './race-engine'

export interface IRaceLiveStanding extends IRaceParticipantProgress {
  readonly position: number
}

function compareProgress(left: IRaceParticipantProgress, right: IRaceParticipantProgress): number {
  if (left.finishTimeMs !== undefined && right.finishTimeMs !== undefined) {
    return left.finishTimeMs - right.finishTimeMs || left.lane - right.lane
  }
  if (left.finishTimeMs !== undefined) return -1
  if (right.finishTimeMs !== undefined) return 1
  return right.progress - left.progress || left.lane - right.lane
}

export function calculateLiveStandings(round: IRaceRoundProgress): readonly IRaceLiveStanding[] {
  return [...round.participants].sort(compareProgress).map((participant, index) => ({
    ...participant,
    position: index + 1,
  }))
}

export function calculateRaceResults(round: IRaceRoundProgress): IRaceRoundResult | undefined {
  if (round.participants.length !== PARTICIPANTS_PER_RACE) return

  const lanes = new Set<number>()
  const finishers: IRaceFinisher[] = []
  for (const { lane, progress, position, finishTimeMs } of calculateLiveStandings(round)) {
    if (progress !== 1 || finishTimeMs === undefined) return
    if (!Number.isInteger(lane) || lane < 1 || lane > PARTICIPANTS_PER_RACE || lanes.has(lane)) {
      throw new RangeError(`Invalid or duplicate finisher lane ${lane}`)
    }
    if (!Number.isFinite(finishTimeMs) || finishTimeMs <= 0) {
      throw new RangeError(`Invalid finish time in lane ${lane}`)
    }
    lanes.add(lane)
    finishers.push({ lane, position, finishTimeMs })
  }

  return { roundNumber: round.roundNumber, finishers }
}
