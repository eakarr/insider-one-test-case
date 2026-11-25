<script setup lang="ts">
import type { THorseMotion } from '@/models/horse'

interface IHorseIconProps {
  color: string
  motion?: THorseMotion
}

withDefaults(defineProps<IHorseIconProps>(), {
  motion: 'still',
})

defineOptions({ name: 'HorseIcon' })
</script>

<template>
  <span
    class="horse-icon"
    :class="{
      'horse-icon--galloping': motion !== 'still',
      'horse-icon--frozen': motion === 'frozen',
    }"
    :style="{ '--horse-color': color }"
    aria-hidden="true"
  ></span>
</template>

<style scoped lang="scss">
.horse-icon {
  display: block;
  position: relative;
  height: 100%;
  aspect-ratio: 254 / 256;
  filter: drop-shadow(0 0 1px #fff8ea) drop-shadow(0 0 1px #fff8ea)
    drop-shadow(0 1px 1px rgb(9 32 23 / 75%));

  &::before,
  &::after {
    display: block;
    background-color: var(--horse-color);
    content: '';
  }

  &::before {
    height: 100%;
    // Crop the padded 838×307 source to its rightmost 254×256 region.
    mask: url('@/assets/images/jockey.png') right top / auto calc(100% * 307 / 256) no-repeat;
  }

  &::after {
    position: absolute;
    inset-block-start: 50%;
    inset-inline-end: 0;
    width: calc(100% * var(--gallop-scale, 1));
    visibility: hidden;
    aspect-ratio: 184 / 134;
    // The eleven poses fit in 184px strides from x=8. Skip the transparent space below them.
    mask: url('@/assets/images/jockey-gallops.png') calc(100% * 8 / 1864) top /
      calc(100% * 2048 / 184) auto no-repeat;
    transform: translateY(-50%);
  }

  &--galloping {
    &::before {
      visibility: hidden;
    }

    &::after {
      visibility: visible;
      animation: horse-gallop calc(660ms / var(--playback-speed, 1)) steps(11) infinite;
    }
  }

  &--frozen::after {
    animation-play-state: paused;
  }
}

@keyframes horse-gallop {
  to {
    // Offset by eleven cells. The animation jumps back before that final offset is shown.
    mask-position: calc(100% * (8 + 184 * 11) / 1864) top;
  }
}

@media (prefers-reduced-motion: reduce) {
  .horse-icon--galloping {
    &::before {
      visibility: visible;
    }

    &::after {
      visibility: hidden;
      animation: none;
    }
  }
}
</style>
