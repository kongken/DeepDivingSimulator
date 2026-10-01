import { SliderField } from '@/components/common/SliderField'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CYLINDERS } from '@/data/cylinders'
import { EXPOSURE_SUITS } from '@/data/exposure-suits'
import { MATERIAL_LABELS } from '@/data/labels'
import { PLAN_LIMITS, calculateWeightCheck } from '@/lib/dive-plan'
import { formatNumber, formatSigned } from '@/lib/format'
import type { DivePlan, DiveSetup } from '@/types/dive'

interface EquipmentFieldsProps {
  setup: DiveSetup
  onChange: (patch: Partial<DivePlan>) => void
}

export function EquipmentFields({ setup, onChange }: EquipmentFieldsProps) {
  const { plan, cylinder, suit } = setup
  const weightCheck = calculateWeightCheck(setup)

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="grid content-start gap-2">
        <Label htmlFor="plan-cylinder" className="text-muted-foreground">
          Cylinder
        </Label>
        <Select value={plan.cylinderId} onValueChange={(cylinderId) => onChange({ cylinderId })}>
          <SelectTrigger id="plan-cylinder" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CYLINDERS.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {cylinder.waterVolume} L · {cylinder.workingPressure} bar ·{' '}
          {MATERIAL_LABELS[cylinder.material]} · empty {formatSigned(cylinder.emptyBuoyancyKg)} kg
        </p>
      </div>

      <div className="grid content-start gap-2">
        <Label htmlFor="plan-suit" className="text-muted-foreground">
          Exposure Suit
        </Label>
        <Select value={plan.suitId} onValueChange={(suitId) => onChange({ suitId })}>
          <SelectTrigger id="plan-suit" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EXPOSURE_SUITS.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {suit.surfaceBuoyancyKg > 0
            ? `${formatSigned(suit.surfaceBuoyancyKg)} kg at the surface — less as the neoprene compresses at depth.`
            : 'No suit: no extra buoyancy to manage.'}
        </p>
      </div>

      <SliderField
        id="plan-weight"
        label="Weight"
        unit="kg"
        fractionDigits={1}
        value={plan.weightKg}
        min={PLAN_LIMITS.weightKg.min}
        max={PLAN_LIMITS.weightKg.max}
        step={PLAN_LIMITS.weightKg.step}
        hint={`Recommended ≈ ${formatNumber(weightCheck.recommendedKg)} kg for this site, suit and cylinder.`}
        className="md:col-span-2"
        onChange={(weightKg) => onChange({ weightKg })}
      />
    </div>
  )
}
