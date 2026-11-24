<script setup lang="ts">
interface IButtonProps {
  variant?: 'primary' | 'secondary'
}

withDefaults(defineProps<IButtonProps>(), {
  variant: 'secondary',
})
</script>

<template>
  <button type="button" class="button" :class="`button--${variant}`">
    <slot />
  </button>
</template>

<style scoped lang="scss">
.button {
  min-height: 2.625rem;
  padding-inline: 1.125rem;
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-small);
  box-shadow: var(--shadow-panel);
  font-size: 0.875rem;
  font-weight: 700;
  line-height: 1.2;
  cursor: pointer;

  &--primary {
    border-color: var(--color-action);
    color: var(--color-on-action);
    background-color: var(--color-action);

    &:not(:disabled):hover {
      border-color: var(--color-action-hover);
      background-color: var(--color-action-hover);
    }
  }

  &--secondary {
    color: var(--color-ink);
    background-color: var(--color-surface);

    &:not(:disabled):hover {
      border-color: var(--color-ink-muted);
      background-color: var(--color-surface-subtle);
    }
  }

  &:disabled {
    border-color: var(--color-line-strong);
    color: var(--color-ink-muted);
    background-color: var(--color-surface-subtle);
    cursor: not-allowed;
  }
}
</style>
