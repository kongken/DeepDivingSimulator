import { cn } from '@/lib/utils'

const FULL_PERCENT = 100

interface VolumeGaugeProps {
  label: string
  value: number
  min: number
  max: number
  /** Optional reference mark, e.g. the neutral lung volume. */
  marker?: number
  className?: string
  fillClassName?: string
}

export function VolumeGauge({
  label,
  value,
  min,
  max,
  marker,
  className,
  fillClassName = 'bg-primary',
}: VolumeGaugeProps) {
  const toPercent = (volume: number) =>
    Math.min(FULL_PERCENT, Math.max(0, ((volume - min) / (max - min)) * FULL_PERCENT))
  return (
    <div
      className={cn('relative h-2 overflow-hidden rounded-full bg-muted', className)}
      role="meter"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={Number(value.toFixed(1))}
    >
      <div
        className={cn('absolute inset-y-0 left-0 rounded-full', fillClassName)}
        style={{ width: `${toPercent(value)}%` }}
      />
      {marker !== undefined ? (
        <div
          className="absolute inset-y-0 w-0.5 bg-foreground/70"
          style={{ left: `${toPercent(marker)}%` }}
        />
      ) : null}
    </div>
  )
}
