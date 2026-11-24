<script setup lang="ts">
interface IHorseIconProps {
  color: string
}

defineProps<IHorseIconProps>()

defineOptions({ name: 'HorseIcon' })
</script>

<template>
  <span class="horse-icon" :style="{ '--horse-color': color }" aria-hidden="true"></span>
</template>

<style scoped lang="scss">
.horse-icon {
  display: block;
  height: 100%;
  aspect-ratio: 254 / 256;
  filter: drop-shadow(0 0 1px #fff8ea) drop-shadow(0 0 1px #fff8ea)
    drop-shadow(0 1px 1px rgb(9 32 23 / 75%));

  &::before {
    display: block;
    height: 100%;
    background-color: var(--horse-color);
    // Crop the padded 838×307 source to its rightmost 254×256 region without resampling it.
    mask: url('../../../assets/images/jockey.png') right top / auto calc(100% * 307 / 256) no-repeat;
    content: '';
  }
}
</style>
