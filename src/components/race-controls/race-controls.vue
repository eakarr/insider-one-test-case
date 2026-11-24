<script setup lang="ts">
import { Button } from '../common'

interface IRaceControlsProps {
  isGenerateDisabled?: boolean
  isStartDisabled?: boolean
  isGeneratePrimary?: boolean
}

withDefaults(defineProps<IRaceControlsProps>(), {
  isGenerateDisabled: false,
  isStartDisabled: true,
})

const emit = defineEmits<{
  'generate-program': []
  'start-race': []
}>()

const handleGenerateProgram = () => emit('generate-program')
const handleStartRace = () => emit('start-race')
</script>

<template>
  <div class="race-controls" role="group" aria-label="Race controls">
    <Button
      class="race-controls__button"
      :variant="isGeneratePrimary ? 'primary' : 'secondary'"
      :disabled="isGenerateDisabled"
      @click="handleGenerateProgram"
    >
      Generate program
    </Button>
    <Button
      class="race-controls__button"
      variant="primary"
      :disabled="isStartDisabled"
      @click="handleStartRace"
    >
      Start race
    </Button>
  </div>
</template>

<style scoped lang="scss">
@use '../../styles/abstracts/breakpoints' as bp;

.race-controls {
  display: grid;
  min-width: 0;
  flex: 1;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
  gap: var(--space-2);

  & > &__button {
    min-width: 0;
    min-height: 2.75rem;
    padding-inline: var(--space-2);

    @media (min-width: bp.$sm) {
      padding-inline: var(--space-3);
    }
  }
}

@media (min-width: bp.$md) {
  .race-controls {
    display: flex;
    flex: 0 1 auto;
  }
}
</style>
