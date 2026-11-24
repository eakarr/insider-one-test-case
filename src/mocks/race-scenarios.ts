import type { IRaceDashboard, IRaceRoundPresentation } from '../models/race'
import { mockHorses } from './race'
import { RACE_DISTANCES } from '../constants/race'

// TODO(Phase 3): Remove temporary race fixtures and preview logic
// once the real race domain and store are implemented.

const scenarios = {
  ready: { current: 1, completed: 0, isActive: false },
  active: { current: 3, completed: 2, isActive: true },
  'round-complete': { current: 3, completed: 3, isActive: false },
  'day-complete': { current: 6, completed: 6, isActive: false },
} as const

type TMockRaceScenario = keyof typeof scenarios

const fields = [
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  [1, 3, 5, 7, 9, 11, 13, 15, 17, 19],
  [2, 4, 6, 8, 10, 12, 14, 16, 18, 20],
  [1, 4, 6, 8, 10, 13, 15, 17, 18, 20],
  [2, 3, 5, 7, 9, 11, 12, 14, 16, 19],
] as const

const activeProgress = [62, 77, 48, 69, 55, 41, 73, 58, 65, 50]
const finishTimes = [0, 0.21, 0.38, 0.57, 0.83, 1.04, 1.27, 1.48, 1.72, 2.06]
const firstFinishTimes = [71.14, 83.62, 96.23, 108.74, 121.09, 134.56]
const horsesById = new Map<number, (typeof mockHorses)[number]>(
  mockHorses.map((horse) => [horse.id, horse]),
)

export function getMockRaceScenario(name: string | null): IRaceDashboard | undefined {
  if (!name || !Object.hasOwn(scenarios, name)) return
  const scenario = scenarios[name as TMockRaceScenario]

  const rounds = RACE_DISTANCES.map((distance, index): IRaceRoundPresentation => {
    const roundNumber = index + 1
    const isCompleted = roundNumber <= scenario.completed
    const isActive = scenario.isActive && roundNumber === scenario.current
    const participants = (fields[index] ?? []).map((id, lane) => {
      const horse = horsesById.get(id)
      if (!horse) throw new Error(`Unknown fixture horse ${id}`)
      return {
        lane: lane + 1,
        horse,
        progress: isCompleted ? 100 : isActive ? (activeProgress[lane] ?? 0) : 0,
      }
    })

    // Rotate the fixed field order for varied, deterministic finishing orders.
    const finishOrder = [...participants.slice(index), ...participants.slice(0, index)]
    return {
      id: roundNumber,
      roundNumber,
      distance,
      status: isCompleted ? 'completed' : isActive ? 'active' : 'scheduled',
      participants,
      results: isCompleted
        ? finishOrder.map(({ horse }, position) => ({
            position: position + 1,
            horse,
            timeSeconds: (firstFinishTimes[index] ?? 0) + (finishTimes[position] ?? 0),
          }))
        : [],
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
  return { rounds, round, standings }
}
