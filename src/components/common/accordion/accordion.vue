<template>
  <details class="accordion">
    <summary class="accordion__trigger">
      <span class="accordion__header"><slot name="header" /></span>
    </summary>
    <div class="accordion__body"><slot /></div>
  </details>
</template>

<style scoped lang="scss">
.accordion {
  border: 1px solid var(--color-line);
  border-radius: var(--radius-small);
  background: var(--color-surface);

  &[open] {
    border-color: var(--color-accent);
  }

  &__trigger {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 0.75rem;
    align-items: start;
    padding: var(--space-2);
    gap: var(--space-1);
    border-radius: var(--radius-small);
    list-style: none;
    cursor: pointer;

    &::-webkit-details-marker {
      display: none;
    }

    &::after {
      width: 0.4375rem;
      height: 0.4375rem;
      justify-self: center;
      margin-block-start: 0.3125rem;
      border-inline-end: 1.5px solid var(--color-ink-muted);
      border-block-end: 1.5px solid var(--color-ink-muted);
      transform: rotate(45deg);
      content: '';
    }

    &:hover {
      background: var(--color-surface-subtle);
    }

    &:focus-visible {
      outline-offset: -3px;
    }
  }

  &[open] > &__trigger {
    border-radius: var(--radius-small) var(--radius-small) 0 0;
    background: var(--color-surface-subtle);

    &::after {
      margin-block-start: 0.5rem;
      transform: rotate(225deg);
    }
  }

  &__header {
    display: grid;
    min-width: 0;
    gap: var(--space-1);
  }

  &__body {
    padding: var(--space-2);
    padding-inline-end: calc(var(--space-2) + var(--space-1) + 0.75rem);
    border-block-start: 1px solid var(--color-line);
  }
}
</style>
