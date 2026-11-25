<script setup lang="ts">
import { DashboardPanel, FlagIcon } from '@/components/common'
import type { IRaceStanding, TStandingsMode } from '@/models/race'

interface IRaceStandingsProps {
  standings: readonly IRaceStanding[]
  mode: TStandingsMode
}

defineProps<IRaceStandingsProps>()

const titles: Record<TStandingsMode, string> = {
  lineup: 'Starting lineup',
  live: 'Live standings',
  final: 'Final standings',
}
</script>

<template>
  <DashboardPanel class="race-standings" :title="titles[mode]">
    <p v-if="!standings.length" class="race-standings__empty">
      Standings appear when a round is on the track.
    </p>
    <ol v-else class="race-standings__order" role="list">
      <li
        v-for="{ position, horse } in standings"
        :key="horse.id"
        class="race-standings__item"
        :class="{ 'race-standings__item--leader': position === 1 && mode !== 'lineup' }"
      >
        <strong class="race-standings__position"
          ><span class="visually-hidden">{{ mode === 'lineup' ? 'Lane' : 'Position' }} </span
          >{{ position }}</strong
        >
        <FlagIcon :color="horse.color" />
        <span class="race-standings__name" :title="horse.name">{{ horse.name }}</span>
      </li>
    </ol>
  </DashboardPanel>
</template>

<style scoped lang="scss">
@use '@/styles/breakpoints' as bp;

.race-standings {
  &__empty {
    margin: 0;
    color: var(--color-ink-muted);
  }

  &__name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__order {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    margin: 0;
    padding: 0;
    gap: var(--space-1);
    list-style: none;
  }

  &__position {
    flex: none;
    min-width: 1rem;
    color: var(--color-ink-muted);
    font-variant-numeric: tabular-nums;
  }

  &__item {
    display: flex;
    align-items: center;
    padding: var(--space-1) var(--space-2);
    gap: var(--space-1);
    border-radius: var(--radius-small);
    background: var(--color-surface-subtle);
    font-size: 0.75rem;

    &--leader {
      color: var(--color-accent);
      font-weight: 700;
    }
  }
}

@media (min-width: bp.$md) {
  .race-standings {
    display: none;
  }
}
</style>
