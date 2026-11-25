import type { RACE_DISTANCES, RACE_PLAYBACK_SPEEDS } from '@/constants/race'

import type { IHorse, TRaceHorse } from './horse'

export type TRaceDistance = (typeof RACE_DISTANCES)[number]
export type TRacePlaybackSpeed = (typeof RACE_PLAYBACK_SPEEDS)[number]

export interface IRaceLaneAssignment {
  readonly lane: number
  readonly horse: TRaceHorse
}

export interface IRaceScheduledRound {
  readonly roundNumber: number
  readonly distance: TRaceDistance
  readonly participants: readonly IRaceLaneAssignment[]
}

export interface IRaceProgram {
  readonly rounds: readonly IRaceScheduledRound[]
}

export interface IRaceParticipantProgress {
  readonly lane: number
  readonly progress: number
  readonly finishTimeMs?: number
}

export interface IRaceFinisher {
  readonly lane: number
  readonly position: number
  readonly finishTimeMs: number
}

export interface IRaceRoundResult {
  readonly roundNumber: number
  readonly finishers: readonly IRaceFinisher[]
}

type TPausableRacePhase =
  | { readonly status: 'countdown'; readonly roundNumber: number; readonly remainingMs: number }
  | {
      readonly status: 'running'
      readonly roundNumber: number
      readonly elapsedMs: number
      readonly participants: readonly IRaceParticipantProgress[]
    }
  | { readonly status: 'round-complete'; readonly remainingMs: number }

interface IRaceDayProgress {
  readonly program: IRaceProgram
  readonly results: readonly IRaceRoundResult[]
}

export type TRaceDayState =
  | { readonly status: 'idle' }
  | { readonly status: 'ready'; readonly program: IRaceProgram }
  | (IRaceDayProgress &
      (
        | TPausableRacePhase
        | { readonly status: 'paused'; readonly interrupted: TPausableRacePhase }
        | { readonly status: 'day-complete' }
      ))

export type TRacePresentationStatus = 'completed' | 'active' | 'scheduled'

export type TStandingsMode = 'lineup' | 'live' | 'final'

export interface IRaceParticipant {
  lane: number
  horse: IHorse
  progress: number
}

export interface IRaceStanding {
  position: number
  horse: IHorse
}

export interface IRaceResultEntry extends IRaceStanding {
  timeSeconds: number
}

export interface IRaceRoundPresentation {
  id: number
  roundNumber: number
  distance: TRaceDistance
  status: TRacePresentationStatus
  participants: readonly IRaceParticipant[]
  results: readonly IRaceResultEntry[]
}
