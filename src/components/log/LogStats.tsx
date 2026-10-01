import { StatTile } from '@/components/common/StatTile'
import type { Tone } from '@/components/common/tone'
import { formatDuration, formatNumber } from '@/lib/format'
import { type AscentLevel, classifyAscentRate } from '@/lib/physics/safety'
import type { DiveLog, SafetyStopOutcome } from '@/types/dive'

const SAFETY_STOP_DISPLAY: Record<SafetyStopOutcome, { label: string; tone: Tone }> = {
  complete: { label: 'Completed', tone: 'success' },
  incomplete: { label: 'Skipped', tone: 'caution' },
  'not-required': { label: 'Not required', tone: 'neutral' },
}

const ASCENT_TONE: Record<AscentLevel, Tone> = {
  normal: 'success',
  fast: 'caution',
  dangerous: 'danger',
}

export function LogStats({ log }: { log: DiveLog }) {
  const safetyStop = SAFETY_STOP_DISPLAY[log.safetyStop]
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      <StatTile label="Dive Site" value={<span className="font-sans">{log.siteName}</span>} />
      <StatTile
        label="Max Depth"
        value={formatNumber(log.maxDepth)}
        unit="m"
        hint={`plan ${log.plan.maxDepth} m`}
      />
      <StatTile
        label="Dive Time"
        value={formatDuration(log.diveTimeSeconds)}
        hint={`plan ${log.plan.bottomTime}:00`}
      />
      <StatTile label="Starting Pressure" value={log.startPressure} unit="bar" />
      <StatTile
        label="Ending Pressure"
        value={Math.round(log.endPressure)}
        unit="bar"
        tone={log.endPressure < log.plan.reservePressure ? 'caution' : 'neutral'}
        hint={`reserve ${log.plan.reservePressure} bar`}
      />
      <StatTile
        label="Gas Used"
        value={Math.round(log.gasUsedLiters)}
        unit="L"
        hint={`incl. ${Math.round(log.bcdGasLiters)} L into the BCD`}
      />
      <StatTile label="Average Depth" value={formatNumber(log.averageDepth)} unit="m" />
      <StatTile
        label="Average SAC"
        value={formatNumber(log.averageSac)}
        unit="L/min"
        hint={`planned ${log.plan.sacRate} L/min`}
      />
      <StatTile
        label="Max Ascent Rate"
        value={formatNumber(Math.max(0, log.maxAscentRate))}
        unit="m/min"
        tone={ASCENT_TONE[classifyAscentRate(log.maxAscentRate)]}
      />
      <StatTile
        label="Safety Stop"
        value={<span className="font-sans">{safetyStop.label}</span>}
        tone={safetyStop.tone}
      />
    </div>
  )
}
