import { createPinia, disposePinia } from 'pinia'
import { afterEach, beforeEach, expect, it } from 'vitest'

import { useRacePresentation } from '@/composables/use-race-presentation'
import { HORSE_IDENTITIES } from '@/constants/horse'
import { RACE_COUNTDOWN_MS, RACE_INTER_ROUND_DELAY_MS, TOTAL_RACE_ROUNDS } from '@/constants/race'
import { useRaceStore } from '@/stores/race'

let pinia: ReturnType<typeof createPinia>
let race: ReturnType<typeof useRaceStore>

beforeEach(() => {
  pinia = createPinia()
  race = useRaceStore(pinia)
  race.initialize(42)
})

afterEach(() => disposePinia(pinia))

it('presents the idle horse pool and groups the opening lineup by lane', () => {
  const view = useRacePresentation(race)

  expect(view.currentRound.value).toBeUndefined()
  expect(view.rounds.value).toEqual([])
  expect(view.standings.value).toEqual([])
  expect(view.horsePoolGroups.value).toEqual([])
  expect(view.canGenerateProgram.value).toBe(true)
  expect(view.canStartRace.value).toBe(false)
  expect(view.horses.value.map(({ colorName }) => colorName)).toEqual(
    HORSE_IDENTITIES.map(({ colorName }) => colorName),
  )

  race.generateProgram()

  expect(view.canStartRace.value).toBe(true)
  expect(view.currentRound.value).toMatchObject({ roundNumber: 1, status: 'scheduled' })
  expect(view.standingsMode.value).toBe('lineup')
  expect(view.horsePoolGroups.value.map(({ label, entries }) => [label, entries.length])).toEqual([
    ['Selected horses', 10],
    ['Not racing', 10],
  ])
  const selected = view.horsePoolGroups.value[0]?.entries
  expect(selected).toEqual(
    view.currentRound.value?.participants.map(({ horse, lane }) => ({
      horse,
      lane,
      position: undefined,
    })),
  )
  const notRacing = view.horsePoolGroups.value[1]?.entries.map(({ horse }) => horse.id)
  expect(notRacing).toEqual(
    view.horses.value
      .filter(({ id }) => !selected?.some(({ horse }) => horse.id === id))
      .map(({ id }) => id),
  )
})

it('shows the countdown, keeps the cue during pause, and maps running progress to percent', () => {
  race.generateProgram()
  const view = useRacePresentation(race)
  const lineup = view.standings.value

  race.startRace()
  expect(view.currentRound.value?.status).toBe('active')
  expect(view.countdownCue.value).toBe(3)
  expect(view.isRunningRound.value).toBe(false)
  race.advanceTime(1200, race.state)
  race.pause()

  expect(view.countdownCue.value).toBe(2)
  expect(view.canPause.value).toBe(false)
  expect(view.canResume.value).toBe(true)
  expect(view.canGenerateProgram.value).toBe(false)
  race.resume()
  race.advanceTime(RACE_COUNTDOWN_MS - 1200, race.state)
  expect(view.countdownCue.value).toBe('START!')
  expect(view.isRunningRound.value).toBe(true)
  race.advanceTime(599, race.state)
  expect(view.countdownCue.value).toBe('START!')
  race.advanceTime(1, race.state)

  expect(view.countdownCue.value).toBeUndefined()
  expect(view.standingsMode.value).toBe('live')
  expect(view.horsePoolGroups.value[0]?.label).toBe('Live standings')
  for (const participant of view.currentRound.value?.participants ?? []) {
    expect(participant.progress).toBe(
      (race.participants.find(({ lane }) => lane === participant.lane)?.progress ?? -1) * 100,
    )
  }
  const namesByLane = new Map(
    race.currentRound?.participants.map(({ lane, horse }) => [lane, horse.name]),
  )
  expect(view.standings.value).not.toBe(lineup)
  expect(view.standings.value.map(({ horse, position }) => [horse.name, position])).toEqual(
    race.standings.map(({ lane, position }) => [namesByLane.get(lane), position]),
  )
})

it('keeps schedule and standings references stable when progress changes without changing rank', () => {
  race.generateProgram()
  race.startRace()
  race.advanceTime(RACE_COUNTDOWN_MS, race.state)
  const view = useRacePresentation(race)
  race.advanceTime(100, race.state)
  const round = view.currentRound.value
  const schedule = view.rounds.value
  const standings = view.standings.value
  const groups = view.horsePoolGroups.value

  race.advanceTime(100, race.state)

  expect(view.currentRound.value?.participants[0]?.progress).toBeGreaterThan(
    round?.participants[0]?.progress ?? 0,
  )
  expect(view.rounds.value).toBe(schedule)
  expect(view.standings.value).toBe(standings)
  expect(view.horsePoolGroups.value).toBe(groups)
})

it('shows final positions and finish times in seconds, then clears the dashboard on Race Again', () => {
  race.generateProgram()
  race.startRace()
  const view = useRacePresentation(race)
  const racingSchedule = view.rounds.value

  for (let round = 1; round <= TOTAL_RACE_ROUNDS; round++) {
    race.advanceTime(RACE_COUNTDOWN_MS, race.state)
    race.advanceTime(30_000, race.state)
    if (round === 1) {
      expect(view.currentRound.value?.status).toBe('completed')
      expect(view.standingsMode.value).toBe('final')
      expect(view.horsePoolGroups.value[0]?.label).toBe('Final standings')
      expect(view.countdownCue.value).toBeUndefined()
      expect(view.rounds.value).not.toBe(racingSchedule)
    }
    if (round < TOTAL_RACE_ROUNDS) race.advanceTime(RACE_INTER_ROUND_DELAY_MS, race.state)
  }
  const result = race.results.at(-1)
  if (!result) throw new Error('Expected final round results')
  const namesByLane = new Map(
    race.currentRound?.participants.map(({ lane, horse }) => [lane, horse.name]),
  )

  expect(view.isDayComplete.value).toBe(true)
  expect(view.currentRound.value?.roundNumber).toBe(TOTAL_RACE_ROUNDS)
  expect(
    view.currentRound.value?.results.map(({ horse, position, timeSeconds }) => [
      horse.name,
      position,
      timeSeconds,
    ]),
  ).toEqual(
    result.finishers.map(({ lane, position, finishTimeMs }) => [
      namesByLane.get(lane),
      position,
      finishTimeMs / 1000,
    ]),
  )
  expect(view.horsePoolGroups.value[0]?.entries.map(({ position }) => position)).toEqual(
    result.finishers.map(({ position }) => position),
  )

  race.raceAgain()

  expect(view.isDayComplete.value).toBe(false)
  expect(view.currentRound.value).toBeUndefined()
  expect(view.rounds.value).toEqual([])
  expect(view.horsePoolGroups.value).toEqual([])
})
