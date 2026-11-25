/** Supply uniform 32-bit draws scaled into [0, 1). */
export type TRandomSource = () => number

const UINT32_RANGE = 2 ** 32

const PCG_MULTIPLIER = 6364136223846793005n
const PCG_INCREMENT = 1442695040888963407n

function advance(state: bigint): bigint {
  return BigInt.asUintN(64, state * PCG_MULTIPLIER + PCG_INCREMENT)
}

/**
 * PCG32 with a fixed stream. Accepts integer seeds from 0 through 2^32 - 1.
 * Throws RangeError for seeds outside that range.
 */
export function createSeededRandom(seed: number): TRandomSource {
  if (!Number.isInteger(seed) || seed < 0 || seed >= UINT32_RANGE) {
    throw new RangeError('Seed must be an unsigned 32-bit integer')
  }

  let state = advance(BigInt(seed) + PCG_INCREMENT)

  return () => {
    const previous = state
    state = advance(previous)
    const mixed = Number(BigInt.asUintN(32, ((previous >> 18n) ^ previous) >> 27n))
    const rotation = Number(previous >> 59n)
    const draw = ((mixed >>> rotation) | (mixed << (-rotation & 31))) >>> 0
    return draw / UINT32_RANGE
  }
}

/**
 * Draw an integer uniformly between min and max, inclusive.
 * Bounds must be safe integers spanning at most 2^32 values, or this throws RangeError.
 * The source must supply uniform 32-bit draws in [0, 1). Invalid draws throw RangeError.
 * Equal bounds consume no draw.
 */
export function randomInt(random: TRandomSource, min: number, max: number): number {
  const range = max - min + 1
  if (
    !Number.isSafeInteger(min) ||
    !Number.isSafeInteger(max) ||
    range < 1 ||
    range > UINT32_RANGE
  ) {
    throw new RangeError('Expected ordered safe integer bounds spanning at most 2^32 values')
  }
  if (min === max) return min

  const bucketSize = Math.floor(UINT32_RANGE / range)
  const finalBucketStart = UINT32_RANGE - bucketSize
  const rejectionStart = (range - 1) * bucketSize
  let draw: number

  // Discard excess draws before the final bucket to preserve both endpoint buckets.
  do {
    const sample = random()
    if (!Number.isFinite(sample) || sample < 0 || sample >= 1) {
      throw new RangeError('Random draw must be finite and in [0, 1)')
    }
    draw = Math.floor(sample * UINT32_RANGE)
  } while (draw >= rejectionStart && draw < finalBucketStart)

  return draw >= finalBucketStart ? max : min + Math.floor(draw / bucketSize)
}
