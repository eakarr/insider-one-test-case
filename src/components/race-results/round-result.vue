<script setup lang="ts">
import { computed } from 'vue'
import type { IRaceResultEntry } from '../../models/race'
import { FlagIcon } from '../common'

interface IRoundResultProps {
  entry: IRaceResultEntry
}

const props = defineProps<IRoundResultProps>()
const seconds = computed(() => props.entry.timeSeconds.toFixed(2))
</script>

<template>
  <span
    class="round-result"
    role="listitem"
    :class="{ 'round-result--winner': entry.position === 1 }"
  >
    <span class="round-result__position"
      ><span class="visually-hidden">Position </span>{{ entry.position }}</span
    >
    <FlagIcon :color="entry.horse.color" />
    <span>{{ entry.horse.name }}</span>
    <time class="round-result__time" :datetime="`PT${seconds}S`">{{ seconds }} s</time>
  </span>
</template>

<style scoped lang="scss">
.round-result {
  display: grid;
  grid-template-columns: 1.1rem auto minmax(0, 1fr) auto;
  align-items: center;
  padding-block: var(--space-1);
  gap: var(--space-1);
  font-size: 0.8125rem;

  &--winner {
    border-radius: var(--radius-small);
    background: var(--color-surface-subtle);
    font-weight: 700;
  }

  &__position,
  &__time {
    color: var(--color-ink-muted);
    font-variant-numeric: tabular-nums;
  }
}
</style>
