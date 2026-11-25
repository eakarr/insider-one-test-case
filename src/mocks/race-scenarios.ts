import type { IRaceDashboard, IRaceRoundPresentation } from '@/models/race'

import { mockHorses } from './race'
import { createMockRaceProgram } from './race-program'
import { createMockRoundResults } from './race-results'

// Fixed dashboard snapshots for development previews only.

const scenarios = {
  ready: { current: 1, completed: 0, isActive: false },
  active: { current: 3, completed: 2, isActive: true },
  'round-complete': { current: 3, completed: 3, isActive: false },
  'day-complete': { current: 6, completed: 6, isActive: false },
} as const

type TMockRaceScenario = keyof typeof scenarios

const activeProgress = [62, 77, 48, 69, 55, 41, 73, 58, 65, 50]

export function getMockRaceScenario(name: string | null): IRaceDashboard | undefined {
  if (name === 'initial') return { horses: mockHorses, rounds: [], standings: [] }
  if (!name || !Object.hasOwn(scenarios, name)) return
  const scenario = scenarios[name as TMockRaceScenario]

  const rounds = createMockRaceProgram().map((round): IRaceRoundPresentation => {
    const isCompleted = round.roundNumber <= scenario.completed
    const isActive = scenario.isActive && round.roundNumber === scenario.current
    if (!isCompleted && !isActive) return round

    const participants = round.participants.map((participant, index) => ({
      ...participant,
      progress: isCompleted ? 100 : (activeProgress[index] ?? 0),
    }))

    return {
      ...round,
      status: isCompleted ? 'completed' : 'active',
      participants,
      results: isCompleted ? createMockRoundResults(round) : [],
    }
  })

  const round = rounds[scenario.current - 1]
  if (!round) return

  const standings =
    round.status === 'completed'
      ? round.results
      : [...round.participants]
          .sort((a, b) => b.progress - a.progress || a.lane - b.lane)
          .map(({ horse }, index) => ({ position: index + 1, horse }))
  return { horses: mockHorses, rounds, round, standings }
}
