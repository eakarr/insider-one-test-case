<script setup lang="ts">
import Button from '@/components/common/button/button.vue'

interface IThemeToggleProps {
  isDark: boolean
}

defineProps<IThemeToggleProps>()
defineEmits<{ toggle: [] }>()
</script>

<template>
  <Button
    class="theme-toggle"
    :aria-label="isDark ? 'Switch to light theme' : 'Switch to dark theme'"
    @click="$emit('toggle')"
  >
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <template v-if="isDark">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19m0-14-1.5 1.5m-11 11L5 19" />
      </template>
      <path v-else d="M20.9 13.35A9 9 0 0 1 10.65 3.1 9 9 0 1 0 20.9 13.35Z" />
    </svg>
  </Button>
</template>

<style scoped lang="scss">
.theme-toggle {
  display: grid;
  width: 2.75rem;
  min-height: 2.75rem;
  flex: 0 0 auto;
  padding: 0;
  place-items: center;

  svg {
    width: 1.125rem;
    height: 1.125rem;
  }
}
</style>
