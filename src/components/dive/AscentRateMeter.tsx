import {
  DANGEROUS_ASCENT_RATE_MPM,
  RUNAWAY_ASCENT_RATE_MPM,
  SAFE_ASCENT_RATE_MPM,
} from '@/lib/physics/constants'
import { classifyAscentRate } from '@/lib/physics/safety'
import { cn } from '@/lib/utils'

const FULL_PERCENT = 100
const toPercent = (rate: number) =>
  Math.min(FULL_PERCENT, Math.max(0, (rate / RUNAWAY_ASCENT_RATE_MPM) * FULL_PERCENT))

const FILL_CLASS = {
  normal: 'bg-success',
  fast: 'bg-warning',
  dangerous: 'bg-danger',
} as const

/** Dive-computer style ascent bar graph with the 9 and 12 m/min limits marked. */
export function AscentRateMeter({ ascentRate }: { ascentRate: number }) {
  const level = classifyAscentRate(ascentRate)
  return (
    <div
      className="relative h-1.5 overflow-hidden rounded-full bg-muted"
      role="meter"
      aria-label="Ascent rate"
      aria-valuemin={0}
      aria-valuemax={RUNAWAY_ASCENT_RATE_MPM}
      aria-valuenow={Math.max(0, Math.round(ascentRate))}
    >
      <div
        className={cn('absolute inset-y-0 left-0 rounded-full', FILL_CLASS[level])}
        style={{ width: `${toPercent(ascentRate)}%` }}
      />
      {[SAFE_ASCENT_RATE_MPM, DANGEROUS_ASCENT_RATE_MPM].map((limit) => (
        <div
          key={limit}
          className="absolute inset-y-0 w-0.5 bg-background"
          style={{ left: `${toPercent(limit)}%` }}
        />
      ))}
    </div>
  )
}
