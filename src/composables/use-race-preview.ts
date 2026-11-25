import { computed, onScopeDispose, shallowRef } from 'vue'

import { RACE_DISTANCES } from '@/constants/race'
import { mockHorses } from '@/mocks/race'
import { createMockRaceProgram } from '@/mocks/race-program'
import { createMockRoundResults } from '@/mocks/race-results'
import type {
  IHorsePoolGroup,
  IRaceDashboard,
  IRaceRoundPresentation,
  IRaceStanding,
  TStandingsMode,
} from '@/models/race'

// TODO(Phase 4): Replace these presentation delays with actual race progression.
const MOCK_ACTIVE_ROUND_DELAY_MS = 2000
const MOCK_COMPLETED_ROUND_DELAY_MS = 1500

function createLineupStandings(round: IRaceRoundPresentation): readonly IRaceStanding[] {
  return round.participants.map(({ lane, horse }) => ({ position: lane, horse }))
}

// TODO(Phase 3): Replace this temporary state with the race domain and Pinia store.
export function useRacePreview(initialPreview?: IRaceDashboard) {
  const dashboard = shallowRef<IRaceDashboard>(initialPreview ?? { rounds: [], standings: [] })
  let lifecycleTimer: ReturnType<typeof setTimeout> | undefined

  onScopeDispose(clearLifecycleTimer)

  const currentRound = computed(() => dashboard.value.round)
  const rounds = computed(() => dashboard.value.rounds)
  const standings = computed(() => dashboard.value.standings)
  const isReadyToStart = computed(() => currentRound.value?.status === 'scheduled')
  const canGenerateProgram = computed(() => !currentRound.value || isReadyToStart.value)
  const isDayComplete = computed(
    () =>
      currentRound.value?.roundNumber === RACE_DISTANCES.length &&
      currentRound.value.status === 'completed',
  )
  const standingsMode = computed<TStandingsMode>(() => {
    if (isReadyToStart.value) return 'lineup'
    if (currentRound.value?.status === 'completed') return 'final'
    return 'live'
  })
  const horsePoolGroups = computed<readonly IHorsePoolGroup[]>(() => {
    const round = currentRound.value
    if (!round) return []

    const lanes = new Map(round.participants.map(({ horse, lane }) => [horse.id, lane]))
    const entries = standings.value.map(({ horse, position }) => ({
      horse,
      lane: lanes.get(horse.id),
      position: round.status === 'scheduled' ? undefined : position,
    }))

    return [
      {
        label:
          round.status === 'scheduled'
            ? 'Selected horses'
            : round.status === 'active'
              ? 'Live standings'
              : 'Final standings',
        entries,
      },
      {
        label: 'Not racing',
        entries: mockHorses.filter(({ id }) => !lanes.has(id)).map((horse) => ({ horse })),
      },
    ]
  })

  function generateProgram() {
    if (!canGenerateProgram.value) return

    const program = createMockRaceProgram()
    const [round] = program
    if (!round) return

    dashboard.value = {
      rounds: program,
      round,
      standings: createLineupStandings(round),
    }
  }

  function startRace() {
    const round = currentRound.value
    if (round) activateRound(round)
  }

  function clearLifecycleTimer() {
    const timer = lifecycleTimer
    lifecycleTimer = undefined
    clearTimeout(timer)
  }

  function updateCurrentRound(round: IRaceRoundPresentation, standings: readonly IRaceStanding[]) {
    dashboard.value = {
      round,
      rounds: rounds.value.map((entry) => (entry.id === round.id ? round : entry)),
      standings,
    }
  }

  function scheduleTransition(
    round: IRaceRoundPresentation,
    delay: number,
    transition: (round: IRaceRoundPresentation) => void,
  ) {
    if (lifecycleTimer !== undefined) return

    const timer = setTimeout(() => {
      if (lifecycleTimer !== timer || currentRound.value !== round) return
      lifecycleTimer = undefined
      transition(round)
    }, delay)
    lifecycleTimer = timer
  }

  function activateRound(round: IRaceRoundPresentation) {
    if (round.status !== 'scheduled') return

    const activeRound: IRaceRoundPresentation = { ...round, status: 'active' }
    updateCurrentRound(activeRound, createLineupStandings(activeRound))
    scheduleTransition(activeRound, MOCK_ACTIVE_ROUND_DELAY_MS, completeRound)
  }

  function completeRound(round: IRaceRoundPresentation) {
    if (round.status !== 'active') return

    const results = createMockRoundResults(round)
    const completedRound: IRaceRoundPresentation = {
      ...round,
      status: 'completed',
      participants: round.participants.map((participant) => ({ ...participant, progress: 100 })),
      results,
    }
    updateCurrentRound(completedRound, results)

    if (!isDayComplete.value) {
      scheduleTransition(completedRound, MOCK_COMPLETED_ROUND_DELAY_MS, advanceRound)
    }
  }

  function advanceRound(round: IRaceRoundPresentation) {
    if (round.status !== 'completed') return

    const nextRound = rounds.value.find((entry) => entry.roundNumber === round.roundNumber + 1)
    if (nextRound) activateRound(nextRound)
  }

  return {
    horses: mockHorses,
    currentRound,
    rounds,
    standings,
    canGenerateProgram,
    isReadyToStart,
    isDayComplete,
    standingsMode,
    horsePoolGroups,
    generateProgram,
    startRace,
  }
}
