import { CircleAlert, Flag, Info, Lightbulb, TriangleAlert } from 'lucide-react'
import { useNavigate } from 'react-router'

import { TONE_SURFACE, type Tone } from '@/components/common/tone'
import { Button } from '@/components/ui/button'
import { type AlertTone, getDiveAlerts, getDiveHint } from '@/lib/dive-status'
import { canEndDive } from '@/lib/physics/simulation'
import { cn } from '@/lib/utils'
import { useDiveStore } from '@/store/dive-store'
import type { DiveSetup } from '@/types/dive'

const ALERT_ICONS: Record<AlertTone, typeof Info> = {
  info: Info,
  caution: TriangleAlert,
  warning: TriangleAlert,
  danger: CircleAlert,
}

/**
 * Fixed-height alert strip: the most severe alert, or a coaching hint when all is well.
 * Keeping the height constant stops the layout from jumping as alerts come and go.
 */
export function DiveAlerts({ setup }: { setup: DiveSetup }) {
  const navigate = useNavigate()
  const simulation = useDiveStore((state) => state.simulation)
  const endDive = useDiveStore((state) => state.endDive)
  if (!simulation) return null

  const alerts = getDiveAlerts(simulation, setup)
  const [primary, ...others] = alerts
  const surfaced = canEndDive(simulation)
  const showEndDive = surfaced && primary?.tone !== 'danger'

  const finishDive = () => {
    const log = endDive()
    if (log) navigate(`/log?id=${log.id}`)
  }

  let tone: Tone = 'neutral'
  let Icon = Lightbulb
  let title: string | null = null
  let message = getDiveHint(simulation, setup)
  if (showEndDive) {
    tone = 'success'
    Icon = Flag
    title = 'SURFACED'
  } else if (primary) {
    tone = primary.tone
    Icon = ALERT_ICONS[primary.tone]
    title = primary.title
    message = primary.message
  }

  return (
    <div
      className={cn(
        'flex min-h-14 flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border px-4 py-2.5 transition-colors',
        TONE_SURFACE[tone],
        tone === 'neutral' && 'text-muted-foreground',
      )}
      role={primary?.tone === 'danger' ? 'alert' : 'status'}
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      {title ? <span className="text-sm font-bold tracking-widest">{title}</span> : null}
      <span className={cn('text-sm', title && 'opacity-90')}>{message}</span>
      <div className="ml-auto flex flex-wrap items-center gap-1.5">
        {(showEndDive ? alerts : others).map((alert) => (
          <span
            key={alert.id}
            className={cn(
              'rounded-full border px-2 py-0.5 text-[0.68rem] font-semibold tracking-wider',
              TONE_SURFACE[alert.tone],
            )}
          >
            {alert.title}
          </span>
        ))}
        {showEndDive ? (
          <Button size="sm" onClick={finishDive}>
            <Flag aria-hidden />
            End Dive
          </Button>
        ) : null}
      </div>
    </div>
  )
}
