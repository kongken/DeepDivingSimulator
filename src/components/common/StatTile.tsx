import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { TONE_TEXT, type Tone } from './tone'

interface StatTileProps {
  label: string
  value: ReactNode
  unit?: string
  hint?: ReactNode
  tone?: Tone
  className?: string
}

export function StatTile({ label, value, unit, hint, tone = 'neutral', className }: StatTileProps) {
  return (
    <div className={cn('rounded-lg border bg-card/60 px-3 py-2.5', className)}>
      <div className="text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase">
        {label}
      </div>
      <div className={cn('mt-1 font-mono text-xl tabular-nums', TONE_TEXT[tone])}>
        {value}
        {unit ? <span className="ml-1 text-xs text-muted-foreground">{unit}</span> : null}
      </div>
      {hint ? <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  )
}
