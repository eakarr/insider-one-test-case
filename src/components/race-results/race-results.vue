<script setup lang="ts">
import { computed } from 'vue'
import { Accordion, DashboardPanel } from '../common'
import type { IRaceRoundPresentation } from '../../models/race'
import RoundResult from './round-result.vue'

interface IRaceResultsProps {
  rounds: readonly IRaceRoundPresentation[]
  totalRounds: number
}

const props = defineProps<IRaceResultsProps>()
const completedRounds = computed(() =>
  props.rounds
    .filter(({ status }) => status === 'completed')
    .sort((a, b) => b.roundNumber - a.roundNumber),
)
</script>

<template>
  <DashboardPanel
    title="Results"
    :meta="`${completedRounds.length} of ${totalRounds}`"
    :is-scrollable="completedRounds.length > 0"
  >
    <p v-if="!completedRounds.length" class="race-results__empty">
      Finishing times appear after each round.
    </p>
    <Accordion v-for="round in completedRounds" :key="round.id" class="race-results__round">
      <template #header>
        <span class="race-results__heading">
          <strong>Round {{ round.roundNumber }}</strong> · {{ round.distance }} m
        </span>
        <span role="list" aria-label="Top three finishers">
          <RoundResult
            v-for="entry in round.results.slice(0, 3)"
            :key="entry.horse.id"
            :entry="entry"
          />
        </span>
      </template>
      <div role="list" aria-label="Remaining finishers">
        <RoundResult v-for="entry in round.results.slice(3)" :key="entry.horse.id" :entry="entry" />
      </div>
    </Accordion>
  </DashboardPanel>
</template>

<style scoped lang="scss">
.race-results {
  &__empty {
    margin: 0;
    color: var(--color-ink-muted);
  }

  &__round + &__round {
    margin-block-start: var(--space-2);
  }

  &__heading {
    font-size: 0.8125rem;
  }
}
</style>
