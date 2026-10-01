import type { ReactNode } from 'react'

import { TONE_TEXT, type Tone } from '@/components/common/tone'
import { cn } from '@/lib/utils'

interface HudReadoutProps {
  label: string
  value: ReactNode
  unit?: string
  tone?: Tone
  size?: 'lg' | 'xl'
  footer?: ReactNode
  className?: string
}

export function HudReadout({
  label,
  value,
  unit,
  tone = 'neutral',
  size = 'lg',
  footer,
  className,
}: HudReadoutProps) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="text-[0.68rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </div>
      <div
        className={cn(
          'mt-1 font-mono leading-none whitespace-nowrap tabular-nums transition-colors',
          size === 'xl' ? 'text-5xl md:text-6xl' : 'text-3xl',
          TONE_TEXT[tone],
        )}
      >
        {value}
        {unit ? (
          <span
            className={cn(
              'ml-1.5 text-muted-foreground',
              size === 'xl' ? 'text-xl md:text-2xl' : 'text-sm',
            )}
          >
            {unit}
          </span>
        ) : null}
      </div>
      {footer ? <div className="mt-2 text-xs text-muted-foreground">{footer}</div> : null}
    </div>
  )
}
