import { MoveRight, TrendingDown, TrendingUp } from 'lucide-react'

import { BuoyancyBars } from '@/components/common/BuoyancyBars'
import { NetBuoyancyReadout } from '@/components/common/NetBuoyancyReadout'
import { TONE_SURFACE, type Tone } from '@/components/common/tone'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatSigned } from '@/lib/format'
import { type BuoyancyTrend, classifyBuoyancyTrend } from '@/lib/physics/buoyancy'
import { cn } from '@/lib/utils'
import { useDiveStore } from '@/store/dive-store'

const TREND_DISPLAY: Record<BuoyancyTrend, { label: string; tone: Tone; Icon: typeof TrendingUp }> =
  {
    increasing: { label: 'Getting lighter', tone: 'info', Icon: TrendingUp },
    steady: { label: 'Steady', tone: 'neutral', Icon: MoveRight },
    decreasing: { label: 'Getting heavier', tone: 'warning', Icon: TrendingDown },
  }

export function BuoyancyPanel() {
  const simulation = useDiveStore((state) => state.simulation)
  if (!simulation) return null

  const trend = classifyBuoyancyTrend(simulation.buoyancyTrend)
  const { label, tone, Icon } = TREND_DISPLAY[trend]

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Net Buoyancy</CardTitle>
        <CardDescription>Every lift and weight acting on you, live</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <NetBuoyancyReadout netKg={simulation.netBuoyancyKg} />
          <div
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs',
              TONE_SURFACE[tone],
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            {label}
            {trend !== 'steady' ? (
              <span className="font-mono tabular-nums">
                {formatSigned(simulation.buoyancyTrend)} kg/min
              </span>
            ) : null}
          </div>
        </div>
        <BuoyancyBars components={simulation.buoyancy} />
      </CardContent>
    </Card>
  )
}
