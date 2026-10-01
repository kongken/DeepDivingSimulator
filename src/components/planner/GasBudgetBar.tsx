import type { GasPlan } from '@/lib/dive-plan'
import { cn } from '@/lib/utils'

const FULL_PERCENT = 100

/** Planned gas use against the cylinder contents, with the reserve marked at the end. */
export function GasBudgetBar({ gasPlan }: { gasPlan: GasPlan }) {
  const { totalGasLiters, requiredGasLiters, reserveGasLiters, sufficient } = gasPlan
  const toPercent = (liters: number) =>
    totalGasLiters > 0 ? Math.min(FULL_PERCENT, (liters / totalGasLiters) * FULL_PERCENT) : 0

  return (
    <div>
      <div
        className="relative h-3 overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`Planned use ${Math.round(requiredGasLiters)} of ${Math.round(totalGasLiters)} liters`}
      >
        <div
          className="absolute inset-y-0 right-0 bg-[repeating-linear-gradient(135deg,var(--caution)_0_4px,transparent_4px_8px)] opacity-40"
          style={{ width: `${toPercent(reserveGasLiters)}%` }}
        />
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full transition-[width]',
            sufficient ? 'bg-primary' : 'bg-danger',
          )}
          style={{ width: `${toPercent(requiredGasLiters)}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
        <span>
          Planned use{' '}
          <span className="font-mono text-foreground">{Math.round(requiredGasLiters)} L</span>
        </span>
        <span>
          Reserve <span className="font-mono text-caution">{Math.round(reserveGasLiters)} L</span>
        </span>
      </div>
    </div>
  )
}
