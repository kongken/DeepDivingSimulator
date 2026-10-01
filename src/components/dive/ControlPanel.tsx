import { ArrowDownToLine, ChevronsDown, ChevronsUp, Minus, Plus, Wind } from 'lucide-react'
import type { ReactNode } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatNumber, formatSigned } from '@/lib/format'
import { calculateTidalOffset } from '@/lib/physics/breathing'
import {
  BCD_MAX_VOLUME_L,
  FINNING_WORKLOAD_FACTOR,
  MAX_LUNG_VOLUME_L,
  MIN_LUNG_VOLUME_L,
  NEUTRAL_LUNG_VOLUME_L,
} from '@/lib/physics/constants'
import { useDiveStore } from '@/store/dive-store'

import { HoldButton } from './HoldButton'
import { VolumeGauge } from './VolumeGauge'

function getBcdHint(venting: boolean, tankEmpty: boolean): string {
  if (venting) return 'Over-pressure valve venting — the BCD is full.'
  if (tankEmpty) return 'Tank empty — the inflator has no gas.'
  return 'Air expands as you rise. Vent early to stay in control.'
}

export function ControlPanel() {
  const simulation = useDiveStore((state) => state.simulation)
  const controls = useDiveStore((state) => state.controls)
  const setControl = useDiveStore((state) => state.setControl)
  const paused = useDiveStore((state) => state.phase === 'paused')
  if (!simulation) return null

  const tankEmpty = simulation.gasRemainingLiters <= 0
  const lungVolume = simulation.lungVolume + calculateTidalOffset(simulation.breathPhase)

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Controls</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <ControlSection
          title="BCD"
          readout={`${formatNumber(simulation.bcdVolume)} L`}
          detail={`${formatSigned(simulation.buoyancy.bcd)} kg lift`}
          gauge={
            <VolumeGauge
              label="BCD volume"
              value={simulation.bcdVolume}
              min={0}
              max={BCD_MAX_VOLUME_L}
            />
          }
          hint={getBcdHint(simulation.bcdVenting, tankEmpty)}
        >
          <HoldButton
            control="inflate"
            label="Inflate"
            shortcut="Space"
            Icon={Plus}
            active={controls.inflate}
            disabled={paused || tankEmpty}
            onHoldChange={setControl}
          />
          <HoldButton
            control="deflate"
            label="Deflate"
            shortcut="Shift"
            Icon={Minus}
            active={controls.deflate}
            disabled={paused}
            onHoldChange={setControl}
          />
        </ControlSection>

        <Separator />

        <ControlSection
          title="Breathing"
          readout={`${formatNumber(lungVolume)} L`}
          detail={`${formatSigned(simulation.buoyancy.lungs)} kg lift`}
          gauge={
            <VolumeGauge
              label="Lung volume"
              value={lungVolume}
              min={MIN_LUNG_VOLUME_L}
              max={MAX_LUNG_VOLUME_L}
              marker={NEUTRAL_LUNG_VOLUME_L}
              fillClassName="bg-info/70"
            />
          }
          hint="A full breath lifts you after a few seconds. Release to breathe normally."
        >
          <HoldButton
            control="inhale"
            label="Inhale"
            shortcut="W"
            Icon={Wind}
            active={controls.inhale}
            disabled={paused}
            onHoldChange={setControl}
          />
          <HoldButton
            control="exhale"
            label="Exhale"
            shortcut="S"
            Icon={ArrowDownToLine}
            active={controls.exhale}
            disabled={paused}
            onHoldChange={setControl}
          />
        </ControlSection>

        <Separator />

        <ControlSection
          title="Movement"
          hint={`Finning moves you without changing buoyancy, but raises gas use ×${FINNING_WORKLOAD_FACTOR}.`}
        >
          <HoldButton
            control="finUp"
            label="Fin up"
            shortcut="↑"
            Icon={ChevronsUp}
            active={controls.finUp}
            disabled={paused}
            onHoldChange={setControl}
          />
          <HoldButton
            control="finDown"
            label="Fin down"
            shortcut="↓"
            Icon={ChevronsDown}
            active={controls.finDown}
            disabled={paused}
            onHoldChange={setControl}
          />
        </ControlSection>
      </CardContent>
    </Card>
  )
}

interface ControlSectionProps {
  title: string
  readout?: string
  detail?: string
  gauge?: ReactNode
  hint: string
  children: ReactNode
}

function ControlSection({ title, readout, detail, gauge, hint, children }: ControlSectionProps) {
  return (
    <section className="grid gap-2.5" aria-label={title}>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          {title}
        </h3>
        {readout ? (
          <span className="font-mono text-sm tabular-nums">
            {readout}
            {detail ? <span className="ml-2 text-xs text-muted-foreground">{detail}</span> : null}
          </span>
        ) : null}
      </div>
      {gauge}
      <div className="flex gap-2">{children}</div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </section>
  )
}
