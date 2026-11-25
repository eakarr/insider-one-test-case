import type { RACE_DISTANCES } from '@/constants/race'

/** Distances in meters, derived from the race-day configuration. */
export type TRaceDistance = (typeof RACE_DISTANCES)[number]

interface IHorseData {
  id: number
  name: string
  color: string
  condition: number
}

export type TRaceHorse = Readonly<IHorseData>

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

// Presentation contracts used by the current dashboard.
export interface IHorse extends IHorseData {
  colorName: string
}

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

export interface IHorsePoolGroup {
  label: string
  entries: readonly { horse: IHorse; lane?: number; position?: number }[]
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

export interface IRaceDashboard {
  rounds: readonly IRaceRoundPresentation[]
  round?: IRaceRoundPresentation
  standings: readonly IRaceStanding[]
}
