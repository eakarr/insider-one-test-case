import { computed, onMounted, onScopeDispose, readonly, ref, watch } from 'vue'

import type { TRacePlaybackSpeed } from '@/models/race'
import type { useRaceStore } from '@/stores/race'

const MAX_FRAME_DELTA_MS = 100

export function useRaceClock(race: ReturnType<typeof useRaceStore>) {
  const isAdvancing = computed(() => {
    const status = race.status
    return status === 'countdown' || status === 'running' || status === 'round-complete'
  })

  const isPageVisible = ref(true)
  const playbackSpeed = ref<TRacePlaybackSpeed>(1)

  function setPlaybackSpeed(speed: TRacePlaybackSpeed) {
    playbackSpeed.value = speed
  }

  let frameId: number | undefined
  let previousTimestamp: number | undefined
  let clockGeneration = 0

  function stopClock() {
    clockGeneration++
    if (frameId !== undefined) cancelAnimationFrame(frameId)
    frameId = undefined
    previousTimestamp = undefined
  }

  function scheduleFrame(generation: number) {
    const id = requestAnimationFrame((timestamp) => {
      if (generation !== clockGeneration || frameId !== id) return
      frameId = undefined

      if (document.hidden || !isAdvancing.value) {
        stopClock()
        return
      }

      const previous = previousTimestamp
      if (previous === undefined || timestamp > previous) {
        previousTimestamp = timestamp
        if (previous !== undefined) {
          const deltaMs = Math.min(timestamp - previous, MAX_FRAME_DELTA_MS)
          const state = race.state
          const simulationDeltaMs =
            state.status === 'running' ? deltaMs * playbackSpeed.value : deltaMs
          const unusedMs = race.advanceTime(simulationDeltaMs, state)
          // Discard boundary overshoot so the next phase starts with its full duration.
          if (unusedMs === undefined) previousTimestamp = undefined
        }
      }

      if (generation === clockGeneration) scheduleFrame(generation)
    })
    frameId = id
  }

  function syncClock() {
    if (document.hidden || !isAdvancing.value) stopClock()
    else if (frameId === undefined) scheduleFrame(clockGeneration)
  }

  function handleVisibilityChange() {
    isPageVisible.value = !document.hidden
    stopClock()
    syncClock()
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
    watch(isAdvancing, syncClock, { flush: 'sync' })
    handleVisibilityChange()
  })

  onScopeDispose(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    stopClock()
  })

  return {
    isPageVisible: readonly(isPageVisible),
    playbackSpeed: readonly(playbackSpeed),
    setPlaybackSpeed,
  }
}
