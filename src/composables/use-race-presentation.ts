import { storeToRefs } from 'pinia'
import { computed } from 'vue'

import { HORSE_IDENTITIES } from '@/constants/horse'
import type { IHorsePoolGroup } from '@/models/horse'
import type { IRaceRoundPresentation, IRaceStanding, TStandingsMode } from '@/models/race'
import type { useRaceStore } from '@/stores/race'

const colorNames = new Map<number, string>(
  HORSE_IDENTITIES.map(({ id, colorName }) => [id, colorName]),
)

export function useRacePresentation(race: ReturnType<typeof useRaceStore>) {
  const {
    horses: domainHorses,
    state,
    program,
    currentRound: scheduledRound,
    participants,
    standings: domainStandings,
    results,
    availableActions,
  } = storeToRefs(race)

  const horses = computed(() =>
    domainHorses.value.map((horse) => ({
      ...horse,
      colorName: colorNames.get(horse.id) ?? horse.color,
    })),
  )
  const horsesById = computed(() => new Map(horses.value.map((horse) => [horse.id, horse])))
  const resultsByRound = computed(
    () => new Map(results.value.map((result) => [result.roundNumber, result])),
  )
  const phase = computed(() =>
    state.value.status === 'paused' ? state.value.interrupted : state.value,
  )

  const programRounds = computed<readonly IRaceRoundPresentation[]>(() =>
    (program.value?.rounds ?? []).map((round) => {
      const result = resultsByRound.value.get(round.roundNumber)
      const participants = round.participants.map(({ lane, horse }) => {
        const displayHorse = horsesById.value.get(horse.id)
        if (!displayHorse)
          throw new Error(`Missing race horse ${horse.id} in the presentation pool`)
        return { lane, horse: displayHorse, progress: result ? 100 : 0 }
      })
      const horsesByLane = new Map(participants.map(({ lane, horse }) => [lane, horse]))

      return {
        id: round.roundNumber,
        roundNumber: round.roundNumber,
        distance: round.distance,
        status: result ? 'completed' : 'scheduled',
        participants,
        results:
          result?.finishers.map(({ lane, position, finishTimeMs }) => {
            const horse = horsesByLane.get(lane)
            if (!horse) throw new Error(`Missing race participant in lane ${lane}`)
            return { horse, position, timeSeconds: finishTimeMs / 1000 }
          }) ?? [],
      }
    }),
  )

  const currentRound = computed<IRaceRoundPresentation | undefined>(() => {
    const round = programRounds.value.find(({ id }) => id === scheduledRound.value?.roundNumber)
    if (!round || (phase.value.status !== 'countdown' && phase.value.status !== 'running'))
      return round

    const progressByLane = new Map(participants.value.map(({ lane, progress }) => [lane, progress]))
    return {
      ...round,
      status: 'active',
      participants: round.participants.map((participant) => ({
        ...participant,
        progress: (progressByLane.get(participant.lane) ?? 0) * 100,
      })),
    }
  })
  const activeRoundId = computed(() =>
    phase.value.status === 'countdown' || phase.value.status === 'running'
      ? scheduledRound.value?.roundNumber
      : undefined,
  )
  const rounds = computed(() =>
    programRounds.value.map((round) =>
      activeRoundId.value === round.id ? { ...round, status: 'active' as const } : round,
    ),
  )
  const standings = computed<readonly IRaceStanding[]>((previous) => {
    const round = currentRound.value
    if (!round) return []
    const horsesByLane = new Map(round.participants.map(({ lane, horse }) => [lane, horse]))
    const next = domainStandings.value.map(({ lane, position }) => {
      const horse = horsesByLane.get(lane)
      if (!horse) throw new Error(`Missing race participant in lane ${lane}`)
      return { horse, position }
    })
    return previous?.length === next.length &&
      next.every(
        (entry, index) =>
          entry.horse === previous[index]?.horse && entry.position === previous[index]?.position,
      )
      ? previous
      : next
  })
  const isDayComplete = computed(() => availableActions.value.canRaceAgain)
  const canGenerateProgram = computed(() => availableActions.value.canGenerateProgram)
  const canStartRace = computed(() => availableActions.value.canStartRace)
  const isRaceDayInProgress = computed(
    () => Boolean(currentRound.value) && !canGenerateProgram.value && !isDayComplete.value,
  )
  const standingsMode = computed<TStandingsMode>(() => {
    if (currentRound.value?.status === 'scheduled') return 'lineup'
    if (currentRound.value?.status === 'completed') return 'final'
    return 'live'
  })
  const horsePoolGroups = computed<readonly IHorsePoolGroup[]>(() => {
    const round = programRounds.value.find(({ id }) => id === scheduledRound.value?.roundNumber)
    if (!round) return []

    const lanes = new Map(round.participants.map(({ horse, lane }) => [horse.id, lane]))
    const mode = standingsMode.value
    return [
      {
        label:
          mode === 'lineup'
            ? 'Selected horses'
            : mode === 'live'
              ? 'Live standings'
              : 'Final standings',
        entries: standings.value.map(({ horse, position }) => ({
          horse,
          lane: lanes.get(horse.id),
          position: mode === 'lineup' ? undefined : position,
        })),
      },
      {
        label: 'Not racing',
        entries: horses.value.filter(({ id }) => !lanes.has(id)).map((horse) => ({ horse })),
      },
    ]
  })

  return {
    horses,
    currentRound,
    rounds,
    standings,
    canGenerateProgram,
    canStartRace,
    isDayComplete,
    isRaceDayInProgress,
    standingsMode,
    horsePoolGroups,
  }
}
