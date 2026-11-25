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
import { useRaceClock } from '@/composables/use-race-clock'
import { useRacePresentation } from '@/composables/use-race-presentation'
import { useTheme } from '@/composables/use-theme'
import { TOTAL_RACE_ROUNDS } from '@/constants/race'
import type { THorseMotion } from '@/models/horse'
import { useRaceStore } from '@/stores/race'

const race = useRaceStore()
const { isPageVisible, playbackSpeed, setPlaybackSpeed } = useRaceClock(race)

const { theme, toggleTheme } = useTheme()
const {
  horses,
  currentRound,
  isRunningRound,
  countdownCue,
  rounds,
  standings,
  canGenerateProgram,
  canStartRace,
  canPause,
  canResume,
  isDayComplete,
  standingsMode,
  horsePoolGroups,
} = useRacePresentation(race)

const isAnimationFrozen = computed(() => race.status === 'paused' || !isPageVisible.value)

const horseMotion = computed<THorseMotion>(() => {
  if (!isRunningRound.value) return 'still'
  return isAnimationFrozen.value ? 'frozen' : 'galloping'
})

function handleGenerateProgram() {
  if (canGenerateProgram.value) race.generateProgram()
}

function handleStartRace() {
  if (canStartRace.value) race.startRace()
}

function handlePauseRace() {
  if (canPause.value) race.pause()
}

function handleResumeRace() {
  if (canResume.value) race.resume()
}

function handleRaceAgain() {
  if (isDayComplete.value) race.raceAgain()
}
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
            :playback-speed="playbackSpeed"
            @change-speed="setPlaybackSpeed"
            :is-generate-disabled="!canGenerateProgram"
            :is-start-disabled="!canStartRace"
            :can-pause="canPause"
            :can-resume="canResume"
            :is-generate-primary="!currentRound"
            @generate-program="handleGenerateProgram"
            @start-race="handleStartRace"
            @pause-race="handlePauseRace"
            @resume-race="handleResumeRace"
          />
        </div>
      </div>
    </header>

    <main id="main-content" class="dashboard-layout" tabindex="-1">
      <RaceTrack
        class="dashboard-layout__workspace"
        :round="currentRound"
        :horse-motion="horseMotion"
        :style="{ '--playback-speed': playbackSpeed }"
        :countdown-cue="countdownCue"
        :is-animation-frozen="isAnimationFrozen"
        :is-paused="canResume"
        :is-day-complete="isDayComplete"
        :horse-count="horses.length"
        @generate-program="handleGenerateProgram"
        @race-again="handleRaceAgain"
      />
      <RaceStandings :standings="standings" :mode="standingsMode" />
      <div class="dashboard-layout__side-panels">
        <RaceProgram :rounds="rounds" :current-round="currentRound?.roundNumber" />
        <RaceResults :rounds="rounds" :total-rounds="TOTAL_RACE_ROUNDS" />
      </div>
      <HorsePool class="dashboard-layout__horses" :horses="horses" :groups="horsePoolGroups" />
    </main>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/breakpoints' as bp;

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
    display: grid;
    min-width: 0;
    grid-template-columns: auto minmax(0, 1.2fr) minmax(0, 0.8fr);
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

    &__controls {
      display: flex;
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
