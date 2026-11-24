<script setup lang="ts">
interface IFlagIconProps {
  color: string
}

defineProps<IFlagIconProps>()

defineOptions({ name: 'FlagIcon' })
</script>

<template>
  <svg
    class="flag-icon"
    viewBox="0 0 16 16"
    width="16"
    height="16"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M3 14V2" stroke="currentColor" stroke-linecap="round" stroke-width="1.25" />
    <path
      d="M3 2.75c3.5-2.5 7 .5 10.5-.75v7.5C10 10.75 6.5 7.75 3 10.25Z"
      :fill="color"
      stroke="currentColor"
      stroke-linejoin="round"
    />
  </svg>
</template>

<style scoped lang="scss">
.flag-icon {
  display: block;
  flex: none;
  color: var(--color-ink-muted);
}
</style>
