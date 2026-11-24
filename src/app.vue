<script setup lang="ts">
import { computed } from 'vue'

import horseRacingLogo from '@/assets/horse-racing.svg'
import { ThemeToggle } from '@/components/common'
import HorsePool from '@/components/horse-pool/horse-pool.vue'
import RaceStandings from '@/components/race-standings/race-standings.vue'
import RaceControls from '@/components/race-controls/race-controls.vue'
import RaceTrack from '@/components/race-track/race-track.vue'
import RaceResults from '@/components/race-results/race-results.vue'
import RaceProgram from '@/components/race-program/race-program.vue'
import { useTheme } from '@/composables/use-theme'
import { RACE_DISTANCES } from '@/constants/race'
import { mockHorses } from '@/mocks/race'
import type { IHorsePoolGroup, IRaceDashboard, TStandingsMode } from '@/models/race'

interface IAppProps {
  preview?: IRaceDashboard
}

const props = defineProps<IAppProps>()
const emit = defineEmits<{ 'generate-program': []; 'start-race': []; 'race-again': [] }>()
const { theme, toggleTheme } = useTheme()
const currentRound = computed(() => props.preview?.round)
const rounds = computed(() => props.preview?.rounds ?? [])
const isRaceActive = computed(() => currentRound.value?.status === 'active')
const isReadyToStart = computed(() => currentRound.value?.status === 'scheduled')
const isDayComplete = computed(
  () =>
    currentRound.value?.roundNumber === RACE_DISTANCES.length &&
    currentRound.value.status === 'completed',
)
const standingsMode = computed<TStandingsMode>(() => {
  if (isReadyToStart.value) return 'lineup'
  if (currentRound.value?.status === 'completed') return 'final'
  return 'live'
})
const horsePoolGroups = computed<readonly IHorsePoolGroup[]>(() => {
  const round = currentRound.value
  if (!round) return []

  const lanes = new Map(round.participants.map(({ horse, lane }) => [horse.id, lane]))
  const entries = (props.preview?.standings ?? []).map(({ horse, position }) => ({
    horse,
    lane: lanes.get(horse.id),
    position: round.status === 'scheduled' ? undefined : position,
  }))

  return [
    {
      label:
        round.status === 'scheduled'
          ? 'Selected horses'
          : round.status === 'active'
            ? 'Live standings'
            : 'Final standings',
      entries,
    },
    {
      label: 'Not racing',
      entries: mockHorses.filter(({ id }) => !lanes.has(id)).map((horse) => ({ horse })),
    },
  ]
})
</script>

<template>
  <div class="app-shell">
    <a class="app-shell__skip-link" href="#main-content">Skip to content</a>

    <header class="dashboard-header">
      <div class="dashboard-header__inner">
        <h1 class="dashboard-header__title">
          <img :src="horseRacingLogo" width="36" height="36" alt="" />Horse Racing
        </h1>
        <div class="dashboard-header__controls">
          <ThemeToggle :is-dark="theme === 'dark'" @toggle="toggleTheme" />
          <RaceControls
            :is-generate-disabled="isRaceActive || isDayComplete"
            :is-start-disabled="!isReadyToStart"
            :is-generate-primary="!currentRound"
            @generate-program="emit('generate-program')"
            @start-race="emit('start-race')"
          />
        </div>
      </div>
    </header>

    <main id="main-content" class="dashboard-layout" tabindex="-1">
      <RaceTrack
        class="dashboard-layout__workspace"
        :round="currentRound"
        :is-day-complete="isDayComplete"
        :horse-count="mockHorses.length"
        @generate-program="emit('generate-program')"
        @race-again="emit('race-again')"
      />
      <RaceStandings :standings="preview?.standings ?? []" :mode="standingsMode" />
      <div class="dashboard-layout__side-panels">
        <RaceProgram :rounds="rounds" :current-round="currentRound?.roundNumber" />
        <RaceResults :rounds="rounds" :total-rounds="RACE_DISTANCES.length" />
      </div>
      <HorsePool class="dashboard-layout__horses" :horses="mockHorses" :groups="horsePoolGroups" />
    </main>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/breakpoints' as bp;

.app-shell {
  min-height: 100dvh;

  &__skip-link {
    position: fixed;
    inset-block-start: var(--space-3);
    inset-inline-start: var(--page-gutter);
    z-index: 10;
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-small);
    color: var(--color-surface);
    background: var(--color-ink);
    transform: translateY(calc(-100% - var(--space-4)));

    &:focus-visible {
      transform: translateY(0);
    }
  }
}

.dashboard-header {
  border-block-end: 1px solid var(--color-line);
  background: var(--color-surface);

  &__inner {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-items: center;
    padding: var(--space-3) var(--page-gutter);
    gap: var(--space-3);
  }

  &__title {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin: 0;
    font-size: 1.25rem;
    letter-spacing: -0.025em;
    line-height: 1.2;
  }

  &__controls {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: var(--space-2);
  }
}

.dashboard-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  padding: var(--space-3) var(--page-gutter);
  gap: var(--space-3);

  &__side-panels {
    display: grid;
    min-width: 0;
    min-height: 0;
    gap: var(--space-3);
  }
}

@media (min-width: bp.$md) {
  .dashboard-header {
    &__inner {
      grid-template-columns: minmax(0, 1fr) auto;
    }
  }

  .dashboard-layout {
    grid-template-areas:
      'workspace workspace'
      'horses side';
    grid-template-columns: repeat(2, minmax(0, 1fr));

    &__workspace {
      grid-area: workspace;
    }

    &__side-panels {
      grid-area: side;
    }

    &__horses {
      grid-area: horses;
    }
  }
}

@media (min-width: bp.$lg) {
  .dashboard-header {
    &__inner {
      min-height: 4.25rem;
    }
  }
}

@media (min-width: bp.$xl) {
  .app-shell {
    display: grid;
    height: 100dvh;
    min-height: 48rem;
    grid-template-rows: auto minmax(0, 1fr);
  }

  .dashboard-layout {
    grid-template-areas: 'horses workspace side';
    grid-template-columns: 15rem minmax(0, 1fr) 17rem;
    align-items: stretch;

    &__side-panels {
      grid-template-rows: repeat(2, minmax(0, 1fr));
      align-items: stretch;
    }
  }
}

@media (min-width: bp.$xxl) {
  .dashboard-layout {
    grid-template-columns: clamp(17rem, 15vw, 20rem) minmax(0, 1fr) clamp(19rem, 17vw, 22rem);
    padding-block: var(--space-4);
    gap: var(--space-4);
  }
}
</style>
