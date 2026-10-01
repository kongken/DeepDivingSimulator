import { useState } from 'react'
import { Link } from 'react-router'

import { BuoyancyBars } from '@/components/common/BuoyancyBars'
import { NetBuoyancyReadout } from '@/components/common/NetBuoyancyReadout'
import { SliderField } from '@/components/common/SliderField'
import { StatTile } from '@/components/common/StatTile'
import { WATER_TYPE_LABELS } from '@/data/labels'
import { PLAN_LIMITS, resolveDiveSetup } from '@/lib/dive-plan'
import { formatNumber } from '@/lib/format'
import { calculateBuoyancyComponents, calculateNetBuoyancy } from '@/lib/physics/buoyancy'
import {
  BCD_MAX_VOLUME_L,
  MAX_LUNG_VOLUME_L,
  MIN_LUNG_VOLUME_L,
  NEUTRAL_LUNG_VOLUME_L,
} from '@/lib/physics/constants'
import { calculateNeutralBcdVolume } from '@/lib/physics/simulation'
import { useDiveStore } from '@/store/dive-store'

import { LabLayout } from './LabLayout'

const MAX_DEPTH_M = 40
const DEFAULT_DEPTH_M = 20
const DEFAULT_BCD_L = 3
const VOLUME_STEP_L = 0.1

export function BuoyancyLab() {
  const plan = useDiveStore((state) => state.plan)
  const setup = resolveDiveSetup(plan)
  const [lungVolume, setLungVolume] = useState(NEUTRAL_LUNG_VOLUME_L)
  const [bcdVolume, setBcdVolume] = useState(DEFAULT_BCD_L)
  const [weightKg, setWeightKg] = useState(plan.weightKg)
  const [depth, setDepth] = useState(DEFAULT_DEPTH_M)

  const components = calculateBuoyancyComponents({
    depth,
    waterType: setup.site.waterType,
    lungVolume,
    bcdVolume,
    suit: setup.suit,
    cylinder: setup.cylinder,
    tankPressure: plan.startPressure,
    weightKg,
  })
  const netKg = calculateNetBuoyancy(components)
  const neutralBcd = calculateNeutralBcdVolume(
    resolveDiveSetup({ ...plan, weightKg }),
    depth,
    plan.startPressure,
    lungVolume,
  )

  return (
    <LabLayout
      title="Buoyancy"
      description="Net buoyancy = body + lungs + BCD + wetsuit + tank − weights"
      controls={
        <>
          <SliderField
            id="lab-buoyancy-lungs"
            label="Lung Volume"
            unit="L"
            fractionDigits={1}
            value={lungVolume}
            min={MIN_LUNG_VOLUME_L}
            max={MAX_LUNG_VOLUME_L}
            step={VOLUME_STEP_L}
            onChange={setLungVolume}
          />
          <SliderField
            id="lab-buoyancy-bcd"
            label="BCD Volume"
            unit="L"
            fractionDigits={1}
            value={bcdVolume}
            min={0}
            max={BCD_MAX_VOLUME_L}
            step={VOLUME_STEP_L}
            onChange={setBcdVolume}
          />
          <SliderField
            id="lab-buoyancy-weight"
            label="Weight"
            unit="kg"
            fractionDigits={1}
            value={weightKg}
            min={PLAN_LIMITS.weightKg.min}
            max={PLAN_LIMITS.weightKg.max}
            step={PLAN_LIMITS.weightKg.step}
            onChange={setWeightKg}
          />
          <SliderField
            id="lab-buoyancy-depth"
            label="Depth"
            unit="m"
            value={depth}
            min={0}
            max={MAX_DEPTH_M}
            step={1}
            onChange={setDepth}
          />
        </>
      }
      insight={
        <>
          1 L of displaced water lifts about 1 kg. Using your planned kit — {setup.suit.name},{' '}
          {setup.cylinder.name} at {plan.startPressure} bar,{' '}
          {WATER_TYPE_LABELS[setup.site.waterType].toLowerCase()} water.{' '}
          <Link to="/planner" className="text-primary underline-offset-4 hover:underline">
            Change it in the planner
          </Link>
          .
        </>
      }
      readouts={
        <>
          <StatTile label="Lungs" value={formatNumber(components.lungs)} unit="kg" />
          <StatTile label="BCD" value={formatNumber(components.bcd)} unit="kg" />
          <StatTile
            label="Wetsuit"
            value={formatNumber(components.wetsuit)}
            unit="kg"
            hint={`at ${depth} m`}
          />
          <StatTile
            label="Air for neutral"
            value={formatNumber(Math.max(0, neutralBcd))}
            unit="L"
            tone="info"
            hint={neutralBcd > BCD_MAX_VOLUME_L ? 'more than the BCD holds' : 'in the BCD'}
          />
        </>
      }
      visualTitle="Net Buoyancy"
      visual={
        <div className="grid gap-5">
          <NetBuoyancyReadout netKg={netKg} />
          <BuoyancyBars components={components} />
        </div>
      }
    />
  )
}
