<script setup lang="ts">
import type { TRaceDistance } from '@/models/race'

interface IRaceCountdownProps {
  cue?: number | 'START!'
  roundNumber: number
  distance: TRaceDistance
  isFrozen: boolean
}

defineProps<IRaceCountdownProps>()
</script>

<template>
  <div class="race-countdown" :class="{ 'race-countdown--frozen': isFrozen }">
    <div v-if="cue !== undefined" class="race-countdown__panel" aria-hidden="true">
      <span class="race-countdown__round">Round {{ roundNumber }} · {{ distance }} m</span>
      <strong :key="cue" class="race-countdown__cue">{{ cue }}</strong>
    </div>
  </div>
</template>

<style scoped lang="scss">
.race-countdown {
  display: grid;
  position: absolute;
  z-index: 1;
  inset: 0;
  place-items: center;
  pointer-events: none;

  &__panel {
    display: grid;
    min-inline-size: 8rem;
    padding: var(--space-3) var(--space-4);
    gap: var(--space-1);
    border: 1px solid var(--color-track-line);
    border-radius: var(--radius-medium);
    background: var(--color-track-dark);
    color: var(--color-on-track);
    box-shadow: var(--shadow-panel);
    text-align: center;
  }

  &__round {
    font-size: 0.75rem;
    font-weight: 600;
  }

  &__cue {
    font-size: clamp(1.5rem, 4vw, 2rem);
    font-variant-numeric: tabular-nums;
    line-height: 1;
    animation: countdown-cue 240ms ease-out;
  }

  &--frozen &__cue {
    animation-play-state: paused;
  }
}

@keyframes countdown-cue {
  from {
    opacity: 0.7;
    transform: scale(0.94);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .race-countdown__cue {
    animation: none;
  }
}
</style>
