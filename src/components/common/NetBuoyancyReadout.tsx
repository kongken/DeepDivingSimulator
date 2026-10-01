import { ArrowDown, ArrowUp, Minus } from 'lucide-react'

import { formatSigned } from '@/lib/format'
import { type BuoyancyState, classifyBuoyancy } from '@/lib/physics/buoyancy'
import { cn } from '@/lib/utils'

import { TONE_TEXT, type Tone } from './tone'

const STATE_DISPLAY: Record<BuoyancyState, { label: string; tone: Tone; Icon: typeof ArrowUp }> = {
  positive: { label: 'Positive', tone: 'info', Icon: ArrowUp },
  neutral: { label: 'Neutral', tone: 'success', Icon: Minus },
  negative: { label: 'Negative', tone: 'warning', Icon: ArrowDown },
}

interface NetBuoyancyReadoutProps {
  netKg: number
  className?: string
}

export function NetBuoyancyReadout({ netKg, className }: NetBuoyancyReadoutProps) {
  const { label, tone, Icon } = STATE_DISPLAY[classifyBuoyancy(netKg)]
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span
        className={cn(
          'flex size-10 items-center justify-center rounded-full border border-current/30',
          TONE_TEXT[tone],
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <div>
        <div className={cn('font-mono text-3xl leading-none tabular-nums', TONE_TEXT[tone])}>
          {formatSigned(netKg)}
          <span className="ml-1 text-base text-muted-foreground">kg</span>
        </div>
        <div className="mt-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          {label}
        </div>
      </div>
    </div>
  )
}
