<script setup lang="ts">
import { computed, useId } from 'vue'

import type { IHorse, IHorsePoolGroup } from '@/models/race'

import HorsePoolItem from './horse-pool-item.vue'

interface IHorsePoolProps {
  horses: readonly IHorse[]
  groups: readonly IHorsePoolGroup[]
}

const props = defineProps<IHorsePoolProps>()
const visibleGroups = computed<readonly IHorsePoolGroup[]>(() =>
  props.groups.length
    ? props.groups
    : [{ label: '', entries: props.horses.map((horse) => ({ horse })) }],
)

const headingId = useId()
const hasLeadingRanks = computed(
  () => visibleGroups.value[0]?.entries.some(({ position }) => position !== undefined) ?? false,
)
</script>

<template>
  <section class="horse-pool" :aria-labelledby="headingId">
    <header class="horse-pool__header">
      <h2 class="horse-pool__title" :id="headingId">Horse pool</h2>
      <span class="horse-pool__count">{{ horses.length }} horses</span>
    </header>

    <div
      class="horse-pool__columns horse-pool__grid"
      :class="{ 'horse-pool__grid--ranked': hasLeadingRanks }"
      aria-hidden="true"
    >
      <span class="horse-pool__name-heading">Horse</span>
      <span class="horse-pool__condition-heading">Condition</span>
    </div>

    <div class="horse-pool__body">
      <div
        v-for="(group, index) in visibleGroups"
        :key="group.label"
        class="horse-pool__group-container"
      >
        <h3
          v-if="group.label"
          class="horse-pool__group"
          :class="{ 'horse-pool__group--primary': index === 0 }"
        >
          {{ group.label }}
          <span class="horse-pool__group-count">{{ group.entries.length }} horses</span>
        </h3>
        <ol class="horse-pool__list" role="list" :aria-label="group.label || undefined">
          <HorsePoolItem
            v-for="{ horse, lane, position } in group.entries"
            :key="horse.id"
            class="horse-pool__row horse-pool__grid"
            :class="{ 'horse-pool__grid--ranked': position !== undefined }"
            :horse="horse"
            :lane="lane"
            :position="position"
          />
        </ol>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/breakpoints' as bp;

.horse-pool {
  --flag-icon-width: 1.25rem;
  --horse-column-gap: 0.3125rem;
  --horse-meter-width: 2.5rem;
  --horse-value-width: 1.875rem;
  --horse-condition-width: calc(
    var(--horse-meter-width) + var(--horse-value-width) + var(--horse-column-gap)
  );
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-medium);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-panel);

  &__header {
    display: flex;
    min-height: 3.25rem;
    align-items: center;
    justify-content: space-between;
    padding-inline: var(--space-4);
    gap: var(--space-3);
    border-block-end: 1px solid var(--color-line);
    background-color: var(--color-surface-subtle);
  }

  &__count {
    color: var(--color-ink-muted);
    font-size: 0.8125rem;
    white-space: nowrap;
  }

  &__title {
    margin: 0;
    color: var(--color-ink);
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: -0.012em;
    line-height: 1.3;
  }

  &__grid {
    --horse-rank-width: 0px;
    display: grid;
    align-items: center;
    grid-template-columns:
      var(--horse-rank-width) calc(var(--flag-icon-width) + var(--horse-column-gap)) minmax(0, 1fr)
      var(--horse-condition-width);
    padding-inline: var(--space-2);

    &--ranked {
      --horse-rank-width: 1.625rem;
    }
  }

  &__columns {
    min-height: 2rem;
    color: var(--color-ink-muted);
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.055em;
    text-transform: uppercase;
  }

  &__name-heading {
    grid-column: 3;
  }

  &__condition-heading {
    grid-column: 4;
  }

  &__list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__row {
    border-block-start: 1px solid var(--color-line);
  }

  &__group {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin: 0;
    padding: var(--space-2) 0.625rem;
    gap: var(--space-2);
    border-block-start: 1px solid var(--color-line);
    background: var(--color-surface-subtle);
    font-size: 0.8125rem;
    font-weight: 600;

    &--primary {
      box-shadow: inset 3px 0 var(--color-accent);
      color: var(--color-accent);
    }
  }

  &__group-count {
    color: var(--color-ink-muted);
    font-weight: 400;
  }

  &__group-container + &__group-container {
    border-block-start: 2px solid var(--color-line);
  }

  &__body {
    position: relative;
  }
}

@media (min-width: bp.$xl) {
  .horse-pool {
    display: flex;
    height: 100%;
    min-height: 0;
    flex-direction: column;

    &__header,
    &__columns {
      flex: 0 0 auto;
    }

    &__columns {
      overflow: hidden;
      scrollbar-gutter: stable;
    }

    &__body {
      min-height: 0;
      flex: 1 1 auto;
      overflow-y: auto;
      scrollbar-color: var(--color-line-strong) var(--color-surface);
      scrollbar-gutter: stable;

      &:focus-visible {
        outline-offset: -3px;
      }
    }
  }
}
</style>
