import { CircleAlert, Info, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

import { TONE_SURFACE, type Tone } from '@/components/common/tone'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  type PlanIssueLevel,
  type WeightStatus,
  calculateGasPlan,
  calculateWeightCheck,
  getPlanIssues,
} from '@/lib/dive-plan'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { DiveSetup } from '@/types/dive'

import { GasBudgetBar } from './GasBudgetBar'

const WEIGHT_STATUS: Record<WeightStatus, { label: string; tone: Tone }> = {
  ok: { label: 'Well weighted', tone: 'success' },
  over: { label: 'Overweighted', tone: 'caution' },
  under: { label: 'Underweighted', tone: 'caution' },
}

const ISSUE_ICONS: Record<PlanIssueLevel, typeof Info> = {
  error: CircleAlert,
  warning: TriangleAlert,
  info: Info,
}

interface PlanSummaryProps {
  setup: DiveSetup
  action: ReactNode
}

export function PlanSummary({ setup, action }: PlanSummaryProps) {
  const { plan, cylinder } = setup
  const gasPlan = calculateGasPlan(plan, cylinder)
  const weight = calculateWeightCheck(setup)
  const issues = getPlanIssues(setup)
  const weightStatus = WEIGHT_STATUS[weight.status]

  return (
    <div className="grid gap-5">
      <section className="grid gap-3">
        <h3 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          Gas plan
        </h3>
        <dl className="grid gap-2 text-sm">
          <SummaryRow label="Available gas" value={`${Math.round(gasPlan.totalGasLiters)} L`} />
          <SummaryRow
            label={`Consumption at ${plan.maxDepth} m`}
            value={`${formatNumber(gasPlan.consumptionAtDepthLpm, 0)} L/min`}
          />
          <SummaryRow
            label="Gas-limited bottom time"
            value={`${Math.floor(gasPlan.maxBottomTimeMinutes)} min`}
          />
          <SummaryRow
            label="Predicted surfacing pressure"
            value={`≈ ${Math.max(0, Math.round(gasPlan.predictedEndPressure))} bar`}
            tone={gasPlan.sufficient ? 'success' : 'danger'}
          />
        </dl>
        <GasBudgetBar gasPlan={gasPlan} />
      </section>

      <Separator />

      <section className="grid gap-3">
        <h3 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          Weighting
        </h3>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">
            Recommended{' '}
            <span className="font-mono text-foreground">
              {formatNumber(weight.recommendedKg)} kg
            </span>
          </span>
          <span
            className={cn(
              'rounded-full border px-2 py-0.5 text-xs',
              TONE_SURFACE[weightStatus.tone],
            )}
          >
            {weightStatus.label}
          </span>
        </div>
      </section>

      {issues.length > 0 ? (
        <section className="grid gap-2">
          {issues.map((issue) => {
            const Icon = ISSUE_ICONS[issue.level]
            return (
              <Alert
                key={issue.id}
                variant={issue.level === 'error' ? 'destructive' : 'default'}
                className={cn(issue.level === 'warning' && 'border-caution/40 text-caution')}
              >
                <Icon aria-hidden />
                <AlertDescription className={cn(issue.level === 'warning' && 'text-caution/90')}>
                  {issue.message}
                </AlertDescription>
              </Alert>
            )
          })}
        </section>
      ) : null}

      {action}
    </div>
  )
}

interface SummaryRowProps {
  label: string
  value: string
  tone?: Tone
}

function SummaryRow({ label, value, tone }: SummaryRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          'font-mono tabular-nums',
          tone === 'success' && 'text-success',
          tone === 'danger' && 'text-danger',
        )}
      >
        {value}
      </dd>
    </div>
  )
}
