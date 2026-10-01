import { SliderField } from '@/components/common/SliderField'
import { PLAN_LIMITS } from '@/lib/dive-plan'
import type { DivePlan, DiveSetup } from '@/types/dive'

interface DivePlanFieldsProps {
  setup: DiveSetup
  onChange: (patch: Partial<DivePlan>) => void
}

export function DivePlanFields({ setup, onChange }: DivePlanFieldsProps) {
  const { plan, site, cylinder } = setup
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <SliderField
        id="plan-max-depth"
        label="Max Depth"
        unit="m"
        value={plan.maxDepth}
        min={PLAN_LIMITS.maxDepth.min}
        max={site.maxDepth}
        step={PLAN_LIMITS.maxDepth.step}
        hint={`Seabed at ${site.maxDepth} m`}
        onChange={(maxDepth) => onChange({ maxDepth })}
      />
      <SliderField
        id="plan-bottom-time"
        label="Bottom Time"
        unit="min"
        value={plan.bottomTime}
        min={PLAN_LIMITS.bottomTime.min}
        max={PLAN_LIMITS.bottomTime.max}
        step={PLAN_LIMITS.bottomTime.step}
        hint="From leaving the surface until you start your ascent."
        onChange={(bottomTime) => onChange({ bottomTime })}
      />
      <SliderField
        id="plan-start-pressure"
        label="Starting Pressure"
        unit="bar"
        value={plan.startPressure}
        min={PLAN_LIMITS.startPressure.min}
        max={cylinder.workingPressure}
        step={PLAN_LIMITS.startPressure.step}
        hint={`${cylinder.name} is rated to ${cylinder.workingPressure} bar`}
        onChange={(startPressure) => onChange({ startPressure })}
      />
      <SliderField
        id="plan-reserve-pressure"
        label="Reserve Pressure"
        unit="bar"
        value={plan.reservePressure}
        min={PLAN_LIMITS.reservePressure.min}
        max={PLAN_LIMITS.reservePressure.max}
        step={PLAN_LIMITS.reservePressure.step}
        hint="Be back at the surface before the gauge drops below this."
        onChange={(reservePressure) => onChange({ reservePressure })}
      />
      <SliderField
        id="plan-sac"
        label="SAC / RMV"
        unit="L/min"
        value={plan.sacRate}
        min={PLAN_LIMITS.sacRate.min}
        max={PLAN_LIMITS.sacRate.max}
        step={PLAN_LIMITS.sacRate.step}
        hint="Relaxed divers breathe 12–15 L/min at the surface; new divers often 18–25."
        className="md:col-span-2"
        onChange={(sacRate) => onChange({ sacRate })}
      />
    </div>
  )
}
