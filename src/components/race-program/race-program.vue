<script setup lang="ts">
import { Accordion, DashboardPanel, FlagIcon } from '@/components/common'
import type { IRaceRoundPresentation, TRacePresentationStatus } from '@/models/race'

interface IRaceProgramProps {
  rounds: readonly IRaceRoundPresentation[]
  currentRound?: number
}

defineProps<IRaceProgramProps>()

const statusLabels: Record<TRacePresentationStatus, string> = {
  scheduled: 'Pending',
  active: 'Racing',
  completed: 'Finished',
}
</script>

<template>
  <DashboardPanel
    title="Program"
    :meta="rounds.length ? `${rounds.length} rounds` : undefined"
    :is-scrollable="rounds.length > 0"
  >
    <p v-if="!rounds.length" class="race-program__empty">
      Generate a program to see the six round lineups.
    </p>
    <ol v-else class="race-program__rounds" role="list">
      <li v-for="round in rounds" :key="round.id" class="race-program__round">
        <Accordion
          :class="{ 'race-program__current-round': round.roundNumber === currentRound }"
          :aria-current="round.roundNumber === currentRound ? 'step' : undefined"
        >
          <template #header>
            <span class="race-program__heading">
              <span
                ><strong>Round {{ round.roundNumber }}</strong> · {{ round.distance }} m</span
              >
              <span class="race-program__status">
                {{
                  round.roundNumber === currentRound && round.status === 'scheduled'
                    ? 'Ready'
                    : statusLabels[round.status]
                }}
              </span>
            </span>
            <span class="race-program__field" aria-hidden="true">
              <span
                v-for="{ lane, horse } in round.participants"
                :key="horse.id"
                :title="`Lane ${lane}: ${horse.name}`"
              >
                <FlagIcon :color="horse.color" />
                {{ lane }}
              </span>
            </span>
          </template>
          <ol class="race-program__lineup" role="list" aria-label="Horses in lane order">
            <li
              v-for="{ lane, horse } in round.participants"
              :key="horse.id"
              class="race-program__participant"
            >
              <span class="race-program__lane"
                ><span class="visually-hidden">Lane </span>{{ lane }}</span
              >
              <FlagIcon :color="horse.color" />
              <span
                >{{ horse.name }}
                <span class="race-program__color">· {{ horse.colorName }}</span></span
              >
            </li>
          </ol>
        </Accordion>
      </li>
    </ol>
  </DashboardPanel>
</template>

<style scoped lang="scss">
.race-program {
  &__empty {
    margin: 0;
    color: var(--color-ink-muted);
  }

  &__rounds,
  &__lineup {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__round + &__round {
    margin-block-start: var(--space-2);
  }

  &__heading {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-1);
    font-size: 0.8125rem;
  }

  &__status {
    color: var(--color-ink-muted);
    font-size: 0.6875rem;
  }

  &__round > &__current-round {
    border-color: var(--color-accent);
  }

  &__current-round &__status {
    color: var(--color-accent);
    font-weight: 700;
  }

  &__field {
    display: grid;
    grid-template-columns: repeat(10, minmax(1rem, 1fr));
    gap: 0.125rem;

    > span {
      display: grid;
      justify-items: center;
      color: var(--color-ink-muted);
      background: var(--color-surface-subtle);
      font-size: 0.625rem;
      font-variant-numeric: tabular-nums;
    }
  }

  &__lineup {
    font-size: 0.75rem;
  }

  &__participant {
    display: grid;
    grid-template-columns: 1.25rem auto minmax(0, 1fr);
    align-items: start;
    padding-block: var(--space-1);
    gap: var(--space-1);
  }

  &__lane,
  &__color {
    color: var(--color-ink-muted);
  }

  &__lane {
    font-variant-numeric: tabular-nums;
  }
}
</style>
