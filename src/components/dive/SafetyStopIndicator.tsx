import { CircleCheck, Pause, Timer } from 'lucide-react'

import { TONE_SURFACE, type Tone } from '@/components/common/tone'
import { formatCountdown } from '@/lib/format'
import { SAFETY_STOP_DEPTH_M } from '@/lib/physics/constants'
import { cn } from '@/lib/utils'
import type { SafetyStopState, SafetyStopStatus } from '@/types/dive'

const STATUS_DISPLAY: Record<
  Exclude<SafetyStopStatus, 'not-required'>,
  { label: string; tone: Tone; Icon: typeof Timer }
> = {
  pending: { label: `Stop at ${SAFETY_STOP_DEPTH_M} m`, tone: 'neutral', Icon: Timer },
  'in-progress': { label: 'Stop', tone: 'success', Icon: Timer },
  paused: { label: 'Stop paused', tone: 'caution', Icon: Pause },
  complete: { label: 'Safety stop complete', tone: 'success', Icon: CircleCheck },
}

export function SafetyStopIndicator({ stop }: { stop: SafetyStopState }) {
  if (stop.status === 'not-required') return null
  const { label, tone, Icon } = STATUS_DISPLAY[stop.status]

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wider uppercase',
        TONE_SURFACE[tone],
      )}
      role="timer"
      aria-live="off"
    >
      <Icon
        className={cn('size-3.5', stop.status === 'in-progress' && 'animate-pulse')}
        aria-hidden
      />
      {label}
      {stop.status !== 'complete' ? (
        <span className="font-mono text-sm tracking-normal tabular-nums">
          {formatCountdown(stop.remainingSeconds)}
        </span>
      ) : null}
    </div>
  )
}
