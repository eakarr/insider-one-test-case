import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'

import { RACE_COUNTDOWN_MS, RACE_INTER_ROUND_DELAY_MS } from '@/constants/race'
import { generateHorses } from '@/domain/generate-horses'
import { generateRaceProgram } from '@/domain/generate-race-program'
import {
  calculateRaceProgress,
  prepareRaceRound,
  type IPreparedRaceRound,
} from '@/domain/race-engine'
import { calculateLiveStandings, calculateRaceResults } from '@/domain/race-results'
import { createSeededRandom } from '@/helpers/random'
import type { IRaceParticipantProgress, TRaceDayState } from '@/models/race'

type TRunningRace = Extract<TRaceDayState, { status: 'running' }>
type TPausableRace = Extract<TRaceDayState, { status: 'countdown' | 'running' | 'round-complete' }>

function createRandomSources(seed: number) {
  // Use distinct seed masks so each stream advances independently.
  return {
    horse: createSeededRandom(seed),
    program: createSeededRandom((seed ^ 0x9e3779b9) >>> 0),
    performance: createSeededRandom((seed ^ 0x85ebca6b) >>> 0),
  }
}

function isPausable(day: TRaceDayState): day is TPausableRace {
  return day.status === 'countdown' || day.status === 'running' || day.status === 'round-complete'
}

export const useRaceStore = defineStore('race', () => {
  let random = createRandomSources(Math.floor(Math.random() * 2 ** 32))
  let canInitialize = true
  let preparedRounds: readonly IPreparedRaceRound[] = []
  const horses = shallowRef(generateHorses(random.horse))
  const state = shallowRef<TRaceDayState>({ status: 'idle' })

  const status = computed(() => state.value.status)
  const program = computed(() => ('program' in state.value ? state.value.program : undefined))
  const results = computed(() => ('results' in state.value ? state.value.results : []))
  const phase = computed(() =>
    state.value.status === 'paused' ? state.value.interrupted : state.value,
  )
  const currentRound = computed(() => {
    const current = phase.value
    const number =
      'roundNumber' in current
        ? current.roundNumber
        : current.status === 'ready'
          ? 1
          : results.value.at(-1)?.roundNumber
    return number === undefined ? undefined : program.value?.rounds[number - 1]
  })
  const participants = computed<readonly IRaceParticipantProgress[]>(() => {
    const current = phase.value
    if (current.status === 'running') return current.participants
    if (current.status === 'round-complete' || current.status === 'day-complete') {
      return (
        results.value.at(-1)?.finishers.map(({ lane, finishTimeMs }) => ({
          lane,
          progress: 1,
          finishTimeMs,
        })) ?? []
      )
    }
    return currentRound.value?.participants.map(({ lane }) => ({ lane, progress: 0 })) ?? []
  })
  const standings = computed(() => {
    const round = currentRound.value
    return round
      ? calculateLiveStandings({ roundNumber: round.roundNumber, participants: participants.value })
      : []
  })
  const availableActions = computed(() => ({
    canGenerateProgram: status.value === 'idle' || status.value === 'ready',
    canStartRace: status.value === 'ready',
    canPause: isPausable(state.value),
    canResume: status.value === 'paused',
    canRaceAgain: status.value === 'day-complete',
  }))

  /** Override the default session seed once, before generating a program. */
  function initialize(seed: number): boolean {
    if (!canInitialize) return false

    random = createRandomSources(seed)
    const pool = generateHorses(random.horse)
    canInitialize = false
    horses.value = pool
    return true
  }

  function generateProgram(): boolean {
    if (!availableActions.value.canGenerateProgram) return false

    const program = generateRaceProgram(horses.value, random.program)
    canInitialize = false
    state.value = { status: 'ready', program }
    return true
  }

  function startRace(): boolean {
    const day = state.value
    if (day.status !== 'ready') return false

    preparedRounds = day.program.rounds.map((round) => prepareRaceRound(round, random.performance))
    state.value = {
      status: 'countdown',
      program: day.program,
      results: [],
      roundNumber: 1,
      remainingMs: RACE_COUNTDOWN_MS,
    }
    return true
  }

  function advanceRunning(day: TRunningRace, deltaMs: number): number | undefined {
    const prepared = preparedRounds[day.roundNumber - 1]
    if (!prepared) return

    const elapsedMs = day.elapsedMs + deltaMs
    if (!Number.isFinite(elapsedMs)) return

    const progress = calculateRaceProgress(prepared, elapsedMs)
    const result = calculateRaceResults(progress)
    if (!result) {
      state.value = { ...day, elapsedMs, participants: progress.participants }
      return 0
    }

    const lastFinisher = result.finishers.at(-1)
    if (!lastFinisher) return

    const results = [...day.results, result]
    state.value =
      day.roundNumber < day.program.rounds.length
        ? {
            status: 'round-complete',
            program: day.program,
            results,
            remainingMs: RACE_INTER_ROUND_DELAY_MS,
          }
        : { status: 'day-complete', program: day.program, results }
    return elapsedMs - lastFinisher.finishTimeMs
  }

  /**
   * Apply time to the captured state only. Returns unused milliseconds at a phase
   * boundary, or undefined when the update is invalid or stale.
   */
  function advanceTime(deltaMs: number, expectedState: TRaceDayState): number | undefined {
    const day = state.value
    if (day !== expectedState || !Number.isFinite(deltaMs) || deltaMs <= 0) return
    if (day.status === 'running') return advanceRunning(day, deltaMs)
    if (day.status !== 'countdown' && day.status !== 'round-complete') return

    if (deltaMs < day.remainingMs) {
      state.value = { ...day, remainingMs: day.remainingMs - deltaMs }
      return 0
    }

    if (day.status === 'countdown') {
      const prepared = preparedRounds[day.roundNumber - 1]
      if (!prepared) return
      state.value = {
        status: 'running',
        program: day.program,
        results: day.results,
        roundNumber: day.roundNumber,
        elapsedMs: 0,
        participants: calculateRaceProgress(prepared, 0).participants,
      }
    } else {
      const nextRound = day.program.rounds[day.results.length]
      if (!nextRound) return
      state.value = {
        status: 'countdown',
        program: day.program,
        results: day.results,
        roundNumber: nextRound.roundNumber,
        remainingMs: RACE_COUNTDOWN_MS,
      }
    }
    return deltaMs - day.remainingMs
  }

  function pause(): boolean {
    const day = state.value
    if (!isPausable(day)) return false

    const { program, results, ...interrupted } = day
    state.value = { status: 'paused', program, results, interrupted }
    return true
  }

  function resume(): boolean {
    const day = state.value
    if (day.status !== 'paused') return false

    state.value = { ...day.interrupted, program: day.program, results: day.results }
    return true
  }

  function resetRace(): boolean {
    if (status.value === 'idle') return false

    preparedRounds = []
    state.value = { status: 'idle' }
    return true
  }

  function raceAgain(): boolean {
    return status.value === 'day-complete' && resetRace()
  }

  return {
    horses,
    state,
    status,
    program,
    currentRound,
    participants,
    standings,
    results,
    availableActions,
    initialize,
    generateProgram,
    startRace,
    advanceTime,
    pause,
    resume,
    raceAgain,
    resetRace,
  }
})
