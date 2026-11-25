<script setup lang="ts">
import { computed, nextTick, ref, useId, useTemplateRef, watch } from 'vue'

import { Button } from '@/components/common'
import { PARTICIPANTS_PER_RACE, RACE_DISTANCES } from '@/constants/race'
import type { THorseMotion } from '@/models/horse'
import type { IRaceRoundPresentation } from '@/models/race'

import RaceCountdown from './race-countdown.vue'
import RaceLane from './race-lane.vue'

interface IRaceTrackProps {
  round?: IRaceRoundPresentation
  isDayComplete?: boolean
  horseCount: number
  horseMotion: THorseMotion
  countdownCue?: number | 'START!'
  isAnimationFrozen: boolean
  isPaused: boolean
}

const props = defineProps<IRaceTrackProps>()
const emit = defineEmits<{ 'generate-program': []; 'race-again': [] }>()

const headingId = useId()
const heading = useTemplateRef<HTMLElement>('heading')
const actionCard = useTemplateRef<HTMLElement>('actionCard')
const statusLabels = {
  scheduled: 'Ready to start',
  active: 'In progress',
  completed: 'Round complete',
}
const announcement = ref('')
watch(
  [
    () => props.isPaused,
    () => props.round?.roundNumber,
    () => props.round?.status,
    () => props.countdownCue,
    () => props.isDayComplete,
  ] as const,
  ([paused, number, status, cue, complete], previous) => {
    if (!status || status === 'scheduled') {
      announcement.value = ''
      return
    }
    if (paused) {
      announcement.value = 'Race paused.'
      return
    }
    if (previous?.[0]) {
      announcement.value = 'Race resumed.'
      return
    }
    if (complete) announcement.value = 'Race day complete. All results are ready.'
    else if (status === 'completed')
      announcement.value = `Round ${number} complete. Results are ready.`
    else if (cue === 3)
      announcement.value = `Round ${number}, ${props.round?.distance} meters. Starting in three seconds.`
    else if (cue === 'START!') announcement.value = `Round ${number} started.`
    else if (cue === 2) announcement.value = 'Two seconds.'
    else if (cue === 1) announcement.value = 'One second.'
  },
)

const splits = [0.25, 0.5, 0.75] as const
const lanes = computed(() =>
  Array.from({ length: PARTICIPANTS_PER_RACE }, (_, index) => {
    const number = index + 1
    const participant = props.round?.participants.find(({ lane }) => lane === number)
    const position = props.round?.results.find(
      ({ horse }) => horse.id === participant?.horse.id,
    )?.position
    return { number, participant, position }
  }),
)

async function handleGenerateProgram() {
  const hadFocus = actionCard.value?.contains(document.activeElement)
  emit('generate-program')
  if (!hadFocus) return

  await nextTick()
  if (props.round && document.activeElement === document.body) {
    heading.value?.focus()
  }
}

async function handleRaceAgain() {
  const hadFocus = actionCard.value?.contains(document.activeElement)
  emit('race-again')
  if (!hadFocus) return

  await nextTick()
  if (!props.round && document.activeElement === document.body) {
    actionCard.value?.querySelector('button')?.focus()
  }
}
</script>

<template>
  <section class="race-track" :aria-labelledby="headingId">
    <header class="race-track__header">
      <h2 ref="heading" class="race-track__title" :id="headingId" tabindex="-1">Race track</h2>
      <p v-if="!round" class="race-track__summary">
        {{ horseCount }} horses · {{ RACE_DISTANCES.length }} rounds ·
        {{ PARTICIPANTS_PER_RACE }} per round
      </p>
      <div v-if="round" class="race-track__round">
        <span class="race-track__meta"
          >Round {{ round.roundNumber }} of {{ RACE_DISTANCES.length }} ·
          {{ round.distance }} m</span
        >
        <strong v-if="!isPaused" class="race-track__status">{{
          isDayComplete ? 'Race day complete' : statusLabels[round.status]
        }}</strong>
      </div>
      <span v-else class="race-track__meta">{{ PARTICIPANTS_PER_RACE }} lanes</span>
    </header>

    <p class="visually-hidden" role="status" aria-atomic="true">{{ announcement }}</p>

    <div class="race-track__body">
      <div class="race-track__viewport">
        <div class="race-track__course">
          <div class="race-track__markers">
            <span class="race-track__marker race-track__marker--start">Start</span>
            <template v-if="round?.status === 'active'">
              <span
                v-for="split in splits"
                :key="split"
                class="race-track__marker race-track__marker--split"
                :style="{ '--split': split }"
                >{{ round.distance * split }} m</span
              >
            </template>
            <span class="race-track__marker race-track__marker--finish">Finish</span>
          </div>

          <ol class="race-track__lanes" role="list" aria-label="Race lanes">
            <RaceLane
              v-for="{ number, participant, position } in lanes"
              :key="number"
              :lane-number="number"
              :horse="participant?.horse"
              :progress="participant?.progress"
              :horse-motion="horseMotion"
              :position="position"
            />
          </ol>
        </div>
      </div>

      <RaceCountdown
        v-if="round"
        :cue="countdownCue"
        :round-number="round.roundNumber"
        :distance="round.distance"
        :is-frozen="isAnimationFrozen"
      />

      <div v-if="isPaused" class="race-track__pause" aria-hidden="true">
        <span class="race-track__pause-label">Paused</span>
      </div>

      <div
        v-if="!round || isDayComplete"
        ref="actionCard"
        class="race-track__card"
        :class="{ 'race-track__card--complete': isDayComplete }"
      >
        <h3 class="race-track__card-title">
          {{ isDayComplete ? 'Race day complete' : 'Ready to race?' }}
        </h3>
        <p v-if="isDayComplete" class="race-track__card-description">
          All six rounds finished. Final standings and results are ready.
        </p>
        <template v-else>
          <p class="race-track__card-description">
            {{ horseCount }} horses. {{ RACE_DISTANCES.length }} rounds. One race day.
          </p>
          <ol class="race-track__guide" aria-label="How to play">
            <li class="race-track__guide-step">
              <svg
                class="race-track__guide-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M3 6h3c5 0 7 12 12 12h3m-4-4 4 4-4 4M3 18h3c5 0 7-12 12-12h3m-4-4 4 4-4 4"
                />
              </svg>
              <div>
                <strong class="race-track__guide-title">Generate</strong>
                <p class="race-track__guide-description">
                  Draw {{ PARTICIPANTS_PER_RACE }} horses for each round.
                </p>
              </div>
            </li>
            <li class="race-track__guide-step">
              <svg
                class="race-track__guide-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                <path d="m8 5 12 7-12 7z" />
              </svg>
              <div>
                <strong class="race-track__guide-title">Race</strong>
                <p class="race-track__guide-description">Start, pause or resume the race day.</p>
              </div>
            </li>
            <li class="race-track__guide-step">
              <svg
                class="race-track__guide-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M8 3h8v6a4 4 0 0 1-8 0V3Zm0 2H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4m-4 2v5m-5 3h10m-8-3h6v3"
                />
              </svg>
              <div>
                <strong class="race-track__guide-title">Results</strong>
                <p class="race-track__guide-description">
                  Follow live standings and round results.
                </p>
              </div>
            </li>
          </ol>
        </template>
        <Button v-if="isDayComplete" variant="primary" @click="handleRaceAgain">Race again</Button>
        <Button v-else variant="primary" @click="handleGenerateProgram">Generate program</Button>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/breakpoints' as bp;

.race-track {
  --marker-height: 1.875rem;
  --lane-label-width: clamp(1.625rem, 3vw, 2.5rem);
  --lane-min-height: clamp(2rem, 4.5vw, 3rem);
  --runner-height: clamp(1.4rem, 3.9vw, 2.75rem);
  --runner-width: calc(var(--runner-height) * 254 / 256);
  --track-edge-gap: clamp(0.3rem, 0.9vw, 0.75rem);
  // Visible gallop frames are up to 125px tall in a 184px-wide cell.
  --gallop-scale: calc(184 / 130);
  --runner-start: max(
    var(--track-edge-gap),
    calc(var(--runner-width) * (var(--gallop-scale) - 1) + var(--space-1))
  );
  --runner-label-width: clamp(3.8rem, 11vw, 6.75rem);
  --runner-label-gap: calc(var(--finish-line-width) + 0.125rem);
  --start-line-position: calc(var(--runner-start) + var(--runner-width));
  --finish-line-position: calc(
    var(--runner-label-width) + var(--runner-label-gap) + var(--track-edge-gap)
  );
  --finish-line-width: clamp(0.375rem, 0.9vw, 0.875rem);
  --start-marker: calc(var(--lane-label-width) + var(--start-line-position));
  --finish-edge: calc(var(--finish-line-position) + var(--finish-line-width));
  display: flex;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  flex-direction: column;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-medium);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-panel);

  &__header {
    display: grid;
    min-height: 3.25rem;
    flex: 0 0 auto;
    align-items: center;
    grid-template-columns: auto minmax(0, 1fr);
    padding: var(--space-2) var(--space-4);
    gap: var(--space-2);
    border-block-end: 1px solid var(--color-line);
    background-color: var(--color-surface-subtle);
  }

  &__meta {
    color: var(--color-ink-muted);
    font-size: 0.8125rem;
  }

  &__title {
    margin: 0;
    flex: 0 0 auto;
    color: var(--color-ink);
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: -0.012em;
    line-height: 1.3;
  }

  &__summary {
    grid-area: 2 / 1 / 3 / -1;
    justify-self: start;
    margin: 0;
    color: var(--color-ink-muted);
    font-size: 0.75rem;
    text-align: start;
  }

  &__round {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    grid-column: 1 / -1;
    justify-content: flex-start;
    gap: var(--space-1) var(--space-3);
    text-align: start;
  }

  &__status {
    color: var(--color-accent);
    font-size: 0.75rem;
  }

  &__body {
    display: grid;
    position: relative;
    min-width: 0;
    min-height: 0;
    flex: 1 1 auto;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
  }

  &__viewport {
    grid-area: 1 / 1;
    min-width: 0;
    min-height: 0;
    max-width: 100%;
  }

  &__course {
    display: flex;
    min-width: 0;
    min-height: 100%;
    flex-direction: column;
    color: var(--color-on-track);
    background-color: var(--color-track);
  }

  &__markers {
    position: relative;
    min-height: var(--marker-height);
    flex: 0 0 auto;
    border-block-end: 1px solid var(--color-track-line);
    background-color: var(--color-track-dark);
  }

  &__marker {
    position: absolute;
    inset-block-start: 50%;
    color: var(--color-on-track);
    font-size: 0.625rem;
    font-weight: 700;
    letter-spacing: 0;
    line-height: 1;
    text-transform: uppercase;
    transform: translateY(-50%);

    &--start {
      inset-inline-start: var(--start-marker);
      transform: translate(-50%, -50%);
    }

    &--split {
      inset-inline-start: calc(
        var(--start-marker) + (100% - var(--start-marker) - var(--finish-edge)) * var(--split)
      );
      transform: translate(-50%, -50%);

      &::after {
        position: absolute;
        inset-block-start: 100%;
        inset-inline-start: 50%;
        height: 0.375rem;
        border-inline-start: 1px solid var(--color-track-line);
        content: '';
      }
    }

    &--finish {
      inset-inline-end: calc(var(--finish-line-position) + var(--finish-line-width) / 2);
      transform: translate(50%, -50%);
    }
  }

  &__lanes {
    display: grid;
    min-height: 0;
    margin: 0;
    padding: 0;
    flex: 1 1 auto;
    grid-auto-rows: minmax(var(--lane-min-height), 1fr);
    list-style: none;
  }

  &__pause {
    position: absolute;
    z-index: 2;
    inset-block-start: calc(var(--marker-height) + var(--space-1));
    inset-inline-end: var(--space-3);
    pointer-events: none;
  }

  &__pause-label {
    display: block;
    padding: var(--space-1) var(--space-2);
    border: 1px solid var(--color-track-line);
    border-radius: var(--radius-small);
    background: var(--color-track-dark);
    color: var(--color-on-track);
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  &__card {
    z-index: 2;
    grid-area: 1 / 1;
    place-self: center;
    width: min(20rem, calc(100% - var(--lane-label-width) - 1.25rem));
    margin-inline-start: var(--lane-label-width);
    padding: var(--space-3);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-medium);
    background: var(--color-surface);
    box-shadow: var(--shadow-panel);
    color: var(--color-ink-muted);
    font-size: 0.8125rem;
    text-align: center;

    &--complete {
      grid-row: 2;
      margin-block: var(--space-3);
      margin-inline-start: 0;
      width: min(17rem, calc(100% - 2rem));
    }
  }

  &__card-description {
    margin: var(--space-1) 0 var(--space-3);
  }

  &__guide {
    display: grid;
    margin: 0 0 var(--space-3);
    padding: var(--space-2) 0 0;
    gap: var(--space-2);
    border-block-start: 1px solid var(--color-line);
    list-style: none;
    text-align: start;
  }

  &__guide-step {
    display: grid;
    grid-template-columns: 2rem minmax(0, 1fr);
    align-items: center;
    gap: var(--space-2);
  }

  &__guide-icon {
    width: 2rem;
    height: 2rem;
    padding: var(--space-1);
    border-radius: var(--radius-small);
    background: var(--color-surface-subtle);
    color: var(--color-accent);
    fill: none;
    stroke: currentColor;
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  &__guide-title {
    color: var(--color-ink);
    font-weight: 600;
  }

  &__guide-description {
    margin: 0;
    line-height: 1.35;
  }

  &__card-title {
    margin: 0;
    color: var(--color-ink);
    font-size: 1rem;
  }
}

@media (min-width: bp.$md) {
  .race-track {
    &__header {
      grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    }

    &__summary {
      grid-area: 1 / 2;
      justify-self: center;
      text-align: center;
    }

    &__round {
      grid-area: 1 / 2 / 2 / -1;
      justify-content: flex-end;
      text-align: end;
    }

    &__header > &__meta {
      grid-area: 1 / 3;
    }

    &__round,
    &__header > &__meta {
      justify-self: end;
    }

    &__card {
      width: min(20rem, calc(100% - 2rem));
      margin: 0;
      padding: var(--space-4);

      &--complete {
        width: min(17rem, calc(100% - 2rem));
        grid-row: 1;
      }
    }
  }
}
</style>
