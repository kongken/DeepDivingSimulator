import { formatSigned } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { BuoyancyComponent, BuoyancyComponents } from '@/types/dive'

const COMPONENT_ORDER: readonly BuoyancyComponent[] = [
  'body',
  'lungs',
  'bcd',
  'wetsuit',
  'cylinder',
  'gas',
  'weights',
]

const COMPONENT_LABELS: Record<BuoyancyComponent, string> = {
  body: 'Body',
  lungs: 'Lungs',
  bcd: 'BCD',
  wetsuit: 'Wetsuit',
  cylinder: 'Tank',
  gas: 'Tank gas',
  weights: 'Weights',
}

/** A bar reaching the edge represents this many kg. */
const FULL_SCALE_KG = 8
const HALF_WIDTH_PERCENT = 50

interface BuoyancyBarsProps {
  components: BuoyancyComponents
  className?: string
}

/** Diverging bars: lift to the right, sinking force to the left. */
export function BuoyancyBars({ components, className }: BuoyancyBarsProps) {
  return (
    <ul className={cn('grid gap-1.5', className)} aria-label="Buoyancy breakdown">
      {COMPONENT_ORDER.map((component) => (
        <BuoyancyBarRow
          key={component}
          label={COMPONENT_LABELS[component]}
          value={components[component]}
        />
      ))}
    </ul>
  )
}

function BuoyancyBarRow({ label, value }: { label: string; value: number }) {
  const widthPercent = Math.min(Math.abs(value) / FULL_SCALE_KG, 1) * HALF_WIDTH_PERCENT
  return (
    <li className="grid grid-cols-[4.5rem_1fr_3.5rem] items-center gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <div className="relative h-2 rounded-full bg-muted">
        <div className="absolute inset-y-[-3px] left-1/2 w-px bg-foreground/25" />
        <div
          className={cn(
            'absolute inset-y-0 rounded-full transition-[width] duration-150',
            value >= 0 ? 'left-1/2 bg-info' : 'right-1/2 bg-warning',
          )}
          style={{ width: `${widthPercent}%` }}
        />
      </div>
      <span className="text-right font-mono tabular-nums">{formatSigned(value)} kg</span>
    </li>
  )
}
