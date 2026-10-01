import type { LabPoint } from './LabLineChart'

/** Samples `fn` at every `step` from `from` to `to` (inclusive). */
export function sampleCurve(
  from: number,
  to: number,
  step: number,
  fn: (x: number) => number,
): LabPoint[] {
  const count = Math.floor((to - from) / step) + 1
  return Array.from({ length: count }, (_, index) => {
    const x = from + index * step
    return { x, y: fn(x) }
  })
}
