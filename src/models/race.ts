import type { RACE_DISTANCES } from '../constants/race'

export interface IHorse {
  id: number
  name: string
  color: string
  colorName: string
  condition: number
}

export type TRaceDistance = (typeof RACE_DISTANCES)[number]

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
