<script setup lang="ts">
import type { IHorse } from '@/models/race'
import { FlagIcon } from '@/components/common'

interface IHorsePoolItemProps {
  horse: IHorse
  lane?: number
  position?: number
}

defineProps<IHorsePoolItemProps>()
</script>

<template>
  <li class="horse-pool-item" :class="{ 'horse-pool-item--racing': lane !== undefined }">
    <span v-if="position !== undefined" class="horse-pool-item__rank">
      <span class="visually-hidden">Position </span>#{{ position }}
    </span>
    <FlagIcon class="horse-pool-item__flag" :color="horse.color" width="20" height="20" />

    <span class="horse-pool-item__identity">
      <strong class="horse-pool-item__name" :title="horse.name">{{ horse.name }}</strong>
      <span class="visually-hidden">Flag color: {{ horse.colorName }}</span>
      <span v-if="lane !== undefined" class="horse-pool-item__lane">Lane {{ lane }}</span>
    </span>

    <span class="horse-pool-item__condition">
      <meter
        :value="horse.condition"
        min="1"
        max="100"
        :aria-label="`Condition ${horse.condition} out of 100`"
      ></meter>
      <strong class="horse-pool-item__condition-value">{{ horse.condition }}</strong>
    </span>
  </li>
</template>

<style scoped lang="scss">
.horse-pool-item {
  min-height: 2.5rem;
  padding-block: var(--space-1);
  background-color: var(--color-surface);

  &--racing {
    min-height: 2.75rem;
    background-color: var(--color-surface-subtle);
  }

  &__flag {
    grid-column: 2;
  }

  &__identity {
    display: flex;
    min-width: 0;
    grid-column: 3;
    flex-direction: column;
    padding-inline-end: 0.125rem;
  }

  &__name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--color-ink);
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1.2;
  }

  &__lane {
    color: var(--color-ink-muted);
    font-size: 0.75rem;
    line-height: 1.25;
    white-space: nowrap;
  }

  &__rank {
    grid-column: 1;
    color: var(--color-accent);
    font-size: 0.8125rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    line-height: 1.2;
    white-space: nowrap;
  }

  &__condition {
    display: flex;
    grid-column: 4;
    align-items: center;
    gap: var(--horse-column-gap);

    meter {
      width: var(--horse-meter-width);
      flex: none;
      margin: 0;
      height: 0.4375rem;
      border: 0;
      border-radius: 999px;
      background: var(--color-condition-track);
      appearance: none;

      &::-webkit-meter-bar {
        border: 0;
        border-radius: 999px;
        background: var(--color-condition-track);
        box-shadow: inset 0 1px 1px rgb(18 34 27 / 10%);
      }

      &::-webkit-meter-optimum-value {
        border-radius: 999px;
        background: var(--color-condition-fill);
      }

      &::-moz-meter-bar {
        border-radius: 999px;
        background: var(--color-condition-fill);
      }
    }
  }

  &__condition-value {
    width: var(--horse-value-width);
    flex: none;
    color: var(--color-ink);
    font-size: 0.875rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    text-align: end;
  }
}
</style>
