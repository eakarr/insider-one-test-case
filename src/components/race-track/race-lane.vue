<script setup lang="ts">
import { computed } from 'vue'

import type { IHorse } from '@/models/race'
import { HorseIcon } from '@/components/common'

interface IRaceLaneProps {
  laneNumber: number
  horse?: IHorse
  progress?: number
  position?: number
}

const props = withDefaults(defineProps<IRaceLaneProps>(), {
  horse: undefined,
  progress: 0,
})

const normalizedProgress = computed(() =>
  Number.isFinite(props.progress) ? Math.min(100, Math.max(0, props.progress)) : 0,
)

const runnerStyle = computed(() => ({
  '--race-progress': `${normalizedProgress.value}%`,
}))

const laneSummary = computed(() => {
  if (!props.horse) {
    return `Lane ${props.laneNumber}, empty`
  }

  if (props.position) {
    return `Lane ${props.laneNumber}, ${props.horse.name}, finished in position ${props.position}`
  }

  if (normalizedProgress.value === 0) {
    return `Lane ${props.laneNumber}, ${props.horse.name}, at the start`
  }

  if (normalizedProgress.value === 100) {
    return `Lane ${props.laneNumber}, ${props.horse.name}, at the finish`
  }

  return `Lane ${props.laneNumber}, ${props.horse.name}, ${Math.round(normalizedProgress.value)}% complete`
})
</script>

<template>
  <li class="race-lane">
    <span class="race-lane__label" aria-hidden="true">
      <strong>{{ laneNumber }}</strong>
    </span>

    <span class="race-lane__course" aria-hidden="true">
      <span class="race-lane__start-line"></span>
      <span class="race-lane__finish-line"></span>
      <span v-if="horse" class="race-lane__runner-path" :style="runnerStyle">
        <span class="race-lane__runner">
          <HorseIcon class="race-lane__horse" :color="horse.color" />
          <span class="race-lane__name" :title="horse.name">
            <b v-if="position" class="race-lane__position">#{{ position }}</b>
            <span class="race-lane__horse-name">{{ horse.name }}</span>
          </span>
        </span>
      </span>
    </span>

    <span class="visually-hidden">{{ laneSummary }}</span>
  </li>
</template>

<style scoped lang="scss">
.race-lane {
  display: grid;
  position: relative;
  min-height: var(--lane-min-height);
  grid-template-columns: var(--lane-label-width) minmax(0, 1fr);
  color: var(--color-on-track);

  & + & {
    border-block-start: 1px solid var(--color-track-line);
  }

  &__label {
    display: grid;
    min-width: 0;
    place-items: center;
    border-inline-end: 1px solid var(--color-track-line);
    background-color: var(--color-track-dark);

    strong {
      font-size: clamp(0.75rem, 1.8vw, 0.9375rem);
      font-variant-numeric: tabular-nums;
      line-height: 1.2;
    }
  }

  &__course {
    position: relative;
    min-width: 0;
    overflow: hidden;
    background-color: var(--color-track);
    background-image: repeating-linear-gradient(
      90deg,
      transparent 0,
      transparent 5.5rem,
      rgb(255 255 255 / 4%) 5.5rem,
      rgb(255 255 255 / 4%) 11rem
    );
  }

  &:nth-child(even) &__course {
    background-color: var(--color-track-alt);
  }

  &__start-line,
  &__finish-line {
    position: absolute;
    inset-block: 0;
    pointer-events: none;
  }

  &__start-line {
    inset-inline-start: var(--start-line-position);
    border-inline-start: 2px solid rgb(255 255 255 / 66%);
    box-shadow: 1px 0 0 rgb(18 63 45 / 24%);
  }

  &__finish-line {
    inset-inline-end: var(--finish-line-position);
    width: var(--finish-line-width);
    background-color: var(--color-on-track);
    background-image: conic-gradient(
      var(--color-checker-dark) 25%,
      var(--color-on-track) 0 50%,
      var(--color-checker-dark) 0 75%,
      var(--color-on-track) 0
    );
    background-size: 0.4375rem 0.4375rem;
    box-shadow:
      -1px 0 0 rgb(255 255 255 / 65%),
      1px 0 0 rgb(18 34 27 / 28%);
  }

  &__runner-path {
    position: absolute;
    inset-block-start: 50%;
    inset-inline-start: var(--runner-start);
    width: calc(100% - var(--start-line-position) - var(--finish-edge));
    transform: translateX(var(--race-progress)) translateY(-50%);
  }

  &__runner {
    display: flex;
    width: max-content;
    height: var(--runner-height);
    align-items: center;
    gap: var(--runner-label-gap);
  }

  &__horse {
    margin-inline-start: auto;
  }

  &__name {
    display: flex;
    min-width: 0;
    max-width: var(--runner-label-width);
    align-items: center;
    padding: 0.125rem var(--space-1);
    gap: 0.125rem;
    border-radius: var(--radius-small);
    color: var(--color-on-track);
    background: var(--color-track-dark);
    font-size: clamp(0.625rem, 1.35vw, 0.75rem);
    line-height: 1.25;
  }

  &__position {
    flex: none;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  &__horse-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
