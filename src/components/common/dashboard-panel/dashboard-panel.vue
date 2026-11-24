<script setup lang="ts">
import { useId } from 'vue'

interface IDashboardPanelProps {
  title: string
  meta?: string
  isScrollable?: boolean
}

defineProps<IDashboardPanelProps>()
const headingId = useId()
</script>

<template>
  <section class="dashboard-panel" :aria-labelledby="headingId">
    <header class="dashboard-panel__header">
      <h2 class="dashboard-panel__title" :id="headingId">{{ title }}</h2>
      <span v-if="meta" class="dashboard-panel__meta">{{ meta }}</span>
    </header>
    <div class="dashboard-panel__body" :class="{ 'dashboard-panel__body--scroll': isScrollable }">
      <slot />
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/breakpoints' as bp;

.dashboard-panel {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-medium);
  background: var(--color-surface);
  box-shadow: var(--shadow-panel);

  &__header {
    display: flex;
    min-height: 3.25rem;
    flex: none;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-2) var(--space-4);
    gap: var(--space-2);
    border-block-end: 1px solid var(--color-line);
    border-radius: var(--radius-medium) var(--radius-medium) 0 0;
    background: var(--color-surface-subtle);
  }

  &__title {
    margin: 0;
    font-size: 1rem;
    line-height: 1.25;
  }

  &__meta {
    color: var(--color-ink-muted);
    font-size: 0.8125rem;
  }

  &__body {
    position: relative;
    min-height: 0;
    padding: var(--space-3);
    overflow-wrap: anywhere;
  }
}

@media (min-width: bp.$xl) {
  .dashboard-panel__body--scroll {
    overflow-y: auto;
    scrollbar-color: var(--color-line-strong) var(--color-surface);
  }
}
</style>
