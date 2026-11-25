<script setup lang="ts">
import { computed } from 'vue'

import { Button } from '@/components/common'
import { RACE_PLAYBACK_SPEEDS } from '@/constants/race'
import type { TRacePlaybackSpeed } from '@/models/race'

interface IRaceControlsProps {
  playbackSpeed: TRacePlaybackSpeed
  isGenerateDisabled?: boolean
  isStartDisabled?: boolean
  isGeneratePrimary?: boolean
  canPause?: boolean
  canResume?: boolean
  canReset?: boolean
}

const props = withDefaults(defineProps<IRaceControlsProps>(), {
  isGenerateDisabled: false,
  isStartDisabled: true,
})

const emit = defineEmits<{
  'change-speed': [speed: TRacePlaybackSpeed]
  'generate-program': []
  'reset-race': []
  'start-race': []
  'pause-race': []
  'resume-race': []
}>()

function handleProgramAction() {
  if (props.canReset) emit('reset-race')
  else if (!props.isGenerateDisabled) emit('generate-program')
}
const actionLabel = computed(() => {
  if (props.canResume) return 'Resume'
  if (props.canPause) return 'Pause'
  return 'Start race'
})

function handleRaceAction() {
  if (props.canResume) emit('resume-race')
  else if (props.canPause) emit('pause-race')
  else if (!props.isStartDisabled) emit('start-race')
}
</script>

<template>
  <div class="race-controls" role="group" aria-label="Race controls">
    <Button
      class="race-controls__button"
      :variant="isGeneratePrimary ? 'primary' : 'secondary'"
      :disabled="isGenerateDisabled && !canReset"
      @click="handleProgramAction"
    >
      {{ canReset ? 'Reset race' : 'Generate program' }}
    </Button>
    <Button
      class="race-controls__button"
      variant="primary"
      :disabled="isStartDisabled && !canPause && !canResume"
      @click="handleRaceAction"
    >
      <span class="race-controls__start-label">
        <span
          v-for="label in ['Start race', 'Pause', 'Resume']"
          :key="label"
          class="race-controls__label"
          :class="{ 'race-controls__label--hidden': label !== actionLabel }"
        >
          {{ label }}
        </span>
      </span>
    </Button>
    <div class="race-controls__speed" role="group" aria-label="Playback speed">
      <button
        v-for="speed in RACE_PLAYBACK_SPEEDS"
        :key="speed"
        type="button"
        class="race-controls__speed-button"
        :aria-pressed="playbackSpeed === speed"
        :aria-label="`${speed} times playback speed`"
        @click="emit('change-speed', speed)"
      >
        {{ speed }}×
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/breakpoints' as bp;

.race-controls {
  display: contents;

  & > &__button {
    min-width: 0;
    min-height: 2.75rem;
    padding-inline: var(--space-2);

    @media (min-width: bp.$sm) {
      padding-inline: var(--space-3);
    }
  }

  &__speed {
    display: flex;
    grid-column: 1 / -1;
    gap: var(--space-1);
    padding: var(--space-1);
    border: 1px solid var(--color-line-strong);
    border-radius: var(--radius-small);
    background: var(--color-surface-subtle);
  }

  &__speed-button {
    flex: 1;
    min-width: 2.25rem;
    min-height: 2.25rem;
    border: 0;
    border-radius: var(--radius-small);
    color: var(--color-ink);
    background: transparent;
    font-weight: 700;
    cursor: pointer;

    &[aria-pressed='true'] {
      color: var(--color-surface);
      background: var(--color-ink);
    }

    &:hover:not([aria-pressed='true']) {
      background: var(--color-surface);
    }
  }

  &__start-label {
    display: inline-grid;
  }

  &__label {
    grid-area: 1 / 1;

    &--hidden {
      visibility: hidden;
    }
  }
}

@media (min-width: bp.$md) {
  .race-controls {
    display: flex;
    flex: 0 1 auto;
    gap: var(--space-2);
  }
}
</style>
