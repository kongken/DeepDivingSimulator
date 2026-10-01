import { TONE_SURFACE, type Tone, toneFromAlert } from '@/components/common/tone'
import { Progress } from '@/components/ui/progress'
import { WATER_TYPE_LABELS } from '@/data/labels'
import { getComputerStatus } from '@/lib/dive-status'
import { formatDuration, formatNumber, formatVerticalRate } from '@/lib/format'
import {
  type AscentLevel,
  type GasLevel,
  classifyAscentRate,
  getGasLevel,
} from '@/lib/physics/safety'
import { calculateAmbientPressure } from '@/lib/physics/pressure'
import { cn } from '@/lib/utils'
import { useDiveStore } from '@/store/dive-store'
import type { DiveSetup } from '@/types/dive'

import { AscentRateMeter } from './AscentRateMeter'
import { HudReadout } from './HudReadout'
import { SafetyStopIndicator } from './SafetyStopIndicator'

const GAS_TONE: Record<GasLevel, Tone> = {
  normal: 'neutral',
  low: 'caution',
  turn: 'caution',
  reserve: 'warning',
  empty: 'danger',
}

const ASCENT_TONE: Record<AscentLevel, Tone> = {
  normal: 'neutral',
  fast: 'warning',
  dangerous: 'danger',
}

const FULL_PERCENT = 100

export function DiveComputer({ setup }: { setup: DiveSetup }) {
  const simulation = useDiveStore((state) => state.simulation)
  if (!simulation) return null

  const { plan, site, cylinder } = setup
  const status = getComputerStatus(simulation, setup)
  const statusTone = toneFromAlert(status.tone)
  const ambientPressure = calculateAmbientPressure(simulation.depth)
  const gasTone = GAS_TONE[getGasLevel(simulation.tankPressure, plan.reservePressure)]
  const ascentTone = ASCENT_TONE[classifyAscentRate(simulation.ascentRate)]

  return (
    <section
      aria-label="Dive computer"
      className={cn(
        'rounded-2xl border bg-card p-4 shadow-lg shadow-black/20 transition-colors md:p-5',
        statusTone === 'danger' && 'animate-alarm border-danger/70',
        statusTone === 'warning' && 'border-warning/60',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'rounded-full border px-3 py-1 text-xs font-semibold tracking-widest uppercase',
            TONE_SURFACE[statusTone],
          )}
          role="status"
        >
          {status.label}
        </span>
        <SafetyStopIndicator stop={simulation.safetyStop} />
        <span className="ml-auto text-xs text-muted-foreground">
          {site.name} · {WATER_TYPE_LABELS[site.waterType]} · {cylinder.name}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 xl:grid-cols-[1.5fr_repeat(5,minmax(0,1fr))]">
        <HudReadout
          label="Depth"
          size="xl"
          value={formatNumber(simulation.depth)}
          unit="m"
          className="col-span-2 sm:col-span-1"
          footer={`max ${formatNumber(simulation.maxDepth)} m · plan ${plan.maxDepth} m`}
        />
        <HudReadout
          label="Dive Time"
          value={formatDuration(simulation.diveTimeSeconds)}
          footer={`plan ${plan.bottomTime}:00`}
        />
        <HudReadout
          label="Tank"
          value={Math.round(simulation.tankPressure)}
          unit="bar"
          tone={gasTone}
          footer={
            <Progress
              value={(simulation.tankPressure / plan.startPressure) * FULL_PERCENT}
              aria-label="Tank pressure"
              className="h-1.5"
            />
          }
        />
        <HudReadout
          label="Gas"
          value={Math.round(simulation.gasRemainingLiters)}
          unit="L"
          tone={gasTone}
          footer={`using ${formatNumber(simulation.gasConsumptionLpm, 0)} L/min`}
        />
        <HudReadout
          label="Ascent"
          value={formatVerticalRate(simulation.ascentRate)}
          unit="m/min"
          tone={ascentTone}
          footer={<AscentRateMeter ascentRate={simulation.ascentRate} />}
        />
        <HudReadout
          label="Ambient"
          value={formatNumber(ambientPressure, 2)}
          unit="ATA"
          footer={`gas use ×${formatNumber(ambientPressure)}`}
        />
      </div>
    </section>
  )
}
