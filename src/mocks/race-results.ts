import type { IRaceResultEntry, IRaceRoundPresentation } from '@/models/race'

// Fixed finishing times for development previews.
const firstFinishTimes = [71.14, 83.62, 96.23, 108.74, 121.09, 134.56]
const finishTimeOffsets = [0, 0.21, 0.38, 0.57, 0.83, 1.04, 1.27, 1.48, 1.72, 2.06]

export function createMockRoundResults({
  roundNumber,
  participants,
}: IRaceRoundPresentation): readonly IRaceResultEntry[] {
  // Rotate the scheduled field to give each round a fixed finishing order.
  const offset = roundNumber - 1
  const finishOrder = [...participants.slice(offset), ...participants.slice(0, offset)]
  const firstFinishTime = firstFinishTimes[offset]
  if (firstFinishTime === undefined)
    throw new Error(`Missing fixture finish time for round ${roundNumber}`)
  if (finishOrder.length !== finishTimeOffsets.length) {
    throw new Error(`Fixture participant and finish-time counts differ in round ${roundNumber}`)
  }

  return finishTimeOffsets.map((timeOffset, index) => {
    const participant = finishOrder[index]
    if (!participant)
      throw new Error(`Missing fixture finisher ${index + 1} in round ${roundNumber}`)

    return {
      position: index + 1,
      horse: participant.horse,
      timeSeconds: firstFinishTime + timeOffset,
    }
  })
}
