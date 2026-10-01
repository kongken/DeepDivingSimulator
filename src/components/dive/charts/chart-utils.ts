import type { DiveSample } from '@/types/dive'

interface TooltipPayloadItem {
  payload?: unknown
}

function isDiveSample(value: unknown): value is Pick<DiveSample, 'time'> {
  return typeof value === 'object' && value !== null && 'time' in value
}

/** Dive time (s) of the sample under the tooltip cursor. */
export function getSampleTime(payload: readonly TooltipPayloadItem[] | undefined): number {
  const sample = payload?.[0]?.payload
  return isDiveSample(sample) ? sample.time : 0
}

/** Charts always span at least this much dive time so early ticks do not repeat. */
const MIN_TIME_SPAN_S = 60

export const TIME_AXIS_DOMAIN: [number, (dataMax: number) => number] = [
  0,
  (dataMax) => Math.max(MIN_TIME_SPAN_S, dataMax),
]
