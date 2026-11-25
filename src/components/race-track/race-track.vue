<script setup lang="ts">
import { computed, nextTick, useId, useTemplateRef } from 'vue'

import { PARTICIPANTS_PER_RACE, RACE_DISTANCES } from '@/constants/race'
import type { IRaceRoundPresentation } from '@/models/race'
import { Button } from '@/components/common'

import RaceLane from './race-lane.vue'

interface IRaceTrackProps {
  round?: IRaceRoundPresentation
  isDayComplete?: boolean
  horseCount: number
}

const props = defineProps<IRaceTrackProps>()
const emit = defineEmits<{ 'generate-program': []; 'race-again': [] }>()

const headingId = useId()
const actionCard = useTemplateRef<HTMLElement>('actionCard')
const statusLabels = {
  scheduled: 'Ready to start',
  active: 'In progress',
  completed: 'Round complete',
}
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
      <h2 class="race-track__title" :id="headingId">Race track</h2>
      <p class="race-track__summary">
        {{ horseCount }} horses · {{ RACE_DISTANCES.length }} rounds ·
        {{ PARTICIPANTS_PER_RACE }} per round
      </p>
      <div v-if="round" class="race-track__round">
        <span class="race-track__meta"
          >Round {{ round.roundNumber }} of {{ RACE_DISTANCES.length }} ·
          {{ round.distance }} m</span
        >
        <strong class="race-track__status">{{
          isDayComplete ? 'Race day complete' : statusLabels[round.status]
        }}</strong>
      </div>
      <span v-else class="race-track__meta">{{ PARTICIPANTS_PER_RACE }} lanes</span>
    </header>

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
              :position="position"
            />
          </ol>
        </div>
      </div>

      <div
        v-if="!round || isDayComplete"
        ref="actionCard"
        class="race-track__card"
        :class="{ 'race-track__card--complete': isDayComplete }"
      >
        <h3 class="race-track__card-title">
          {{ isDayComplete ? 'Race day complete' : 'Set the starting field' }}
        </h3>
        <p class="race-track__card-description">
          {{
            isDayComplete
              ? 'All six rounds finished. Final standings and results are ready.'
              : 'Draw ten horses for each of the six rounds.'
          }}
        </p>
        <Button v-if="isDayComplete" variant="primary" @click="handleRaceAgain">Race again</Button>
        <Button v-else variant="primary" @click="$emit('generate-program')"
          >Generate program</Button
        >
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/breakpoints' as bp;

.race-track {
  --lane-label-width: clamp(1.625rem, 3vw, 2.5rem);
  --lane-min-height: clamp(2rem, 4.5vw, 3rem);
  --runner-height: clamp(1.4rem, 3.9vw, 2.75rem);
  --runner-width: calc(var(--runner-height) * 254 / 256);
  --runner-start: clamp(0.3rem, 0.9vw, 0.75rem);
  --runner-label-width: clamp(3.8rem, 11vw, 6.75rem);
  --runner-label-gap: calc(var(--finish-line-width) + 0.125rem);
  --start-line-position: calc(var(--runner-start) + var(--runner-width));
  --finish-line-position: calc(
    var(--runner-label-width) + var(--runner-label-gap) + var(--runner-start)
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
    justify-self: center;
    margin: 0;
    color: var(--color-ink-muted);
    font-size: 0.75rem;
    text-align: center;
  }

  &__round {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: flex-end;
    column-gap: var(--space-2);
    text-align: end;
  }

  &__status {
    color: var(--color-accent);
    font-size: 0.75rem;
  }

  &__body {
    display: grid;
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
    min-height: 1.875rem;
    flex: 0 0 auto;
    border-block-end: 1px solid var(--color-track-line);
    background-color: var(--color-track-dark);
  }

  &__marker {
    position: absolute;
    inset-block-start: 50%;
    color: rgb(255 255 255 / 82%);
    font-size: clamp(0.5625rem, 1.25vw, 0.625rem);
    font-weight: 700;
    letter-spacing: 0.03em;
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

  &__card {
    z-index: 2;
    grid-area: 1 / 1;
    place-self: center;
    width: min(17rem, calc(100% - var(--lane-label-width) - 1.25rem));
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
    }

    &__round,
    &__header > &__meta {
      justify-self: end;
    }

    &__card {
      width: min(17rem, calc(100% - 2rem));
      margin: 0;
      padding: var(--space-4);

      &--complete {
        grid-row: 1;
      }
    }
  }
}
</style>
