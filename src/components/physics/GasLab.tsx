import { useState } from 'react'

import { SliderField } from '@/components/common/SliderField'
import { StatTile } from '@/components/common/StatTile'
import { getCylinder } from '@/data/cylinders'
import { DEFAULT_PLAN, PLAN_LIMITS } from '@/lib/dive-plan'
import { formatNumber } from '@/lib/format'
import {
  calculateGasConsumption,
  calculateGasDurationMinutes,
  calculateGasVolume,
} from '@/lib/physics/gas'
import { calculateAmbientPressure } from '@/lib/physics/pressure'

import { LabLayout } from './LabLayout'
import { LabLineChart } from './LabLineChart'
import { sampleCurve } from './curve'

const MAX_DEPTH_M = 40
const DEPTH_STEP_M = 1
const DEFAULT_DEPTH_M = 20
const REFERENCE_CYLINDER = getCylinder('al80')
const REFERENCE_USABLE_GAS_L =
  calculateGasVolume(REFERENCE_CYLINDER.waterVolume, DEFAULT_PLAN.startPressure) -
  calculateGasVolume(REFERENCE_CYLINDER.waterVolume, DEFAULT_PLAN.reservePressure)

export function GasLab() {
  const [sacRate, setSacRate] = useState(DEFAULT_PLAN.sacRate)
  const [depth, setDepth] = useState(DEFAULT_DEPTH_M)
  const consumption = calculateGasConsumption(sacRate, depth)
  const curve = sampleCurve(0, MAX_DEPTH_M, DEPTH_STEP_M, (x) =>
    calculateGasConsumption(sacRate, x),
  )

  return (
    <LabLayout
      title="Gas Consumption"
      description="Actual consumption = SAC × ambient pressure"
      controls={
        <>
          <SliderField
            id="lab-gas-sac"
            label="SAC / RMV"
            unit="L/min"
            value={sacRate}
            min={PLAN_LIMITS.sacRate.min}
            max={PLAN_LIMITS.sacRate.max}
            step={PLAN_LIMITS.sacRate.step}
            onChange={setSacRate}
          />
          <SliderField
            id="lab-gas-depth"
            label="Depth"
            unit="m"
            value={depth}
            min={0}
            max={MAX_DEPTH_M}
            step={DEPTH_STEP_M}
            onChange={setDepth}
          />
        </>
      }
      insight={
        <>
          Your regulator delivers air at ambient pressure, so every breath at {depth} m takes{' '}
          {formatNumber(calculateAmbientPressure(depth), 1)}× the gas of the same breath at the
          surface. Deeper dives drain the tank faster.
        </>
      }
      readouts={
        <>
          <StatTile label="Surface Consumption" value={sacRate} unit="L/min" />
          <StatTile
            label="Actual Consumption"
            value={formatNumber(consumption, 0)}
            unit="L/min"
            tone="info"
          />
          <StatTile
            label="AL80 200 → 50 bar"
            value={Math.floor(calculateGasDurationMinutes(REFERENCE_USABLE_GAS_L, sacRate, depth))}
            unit="min"
            hint={`at ${depth} m`}
          />
          <StatTile
            label="Same tank at 0 m"
            value={Math.floor(calculateGasDurationMinutes(REFERENCE_USABLE_GAS_L, sacRate, 0))}
            unit="min"
          />
        </>
      }
      visualTitle="Consumption vs Depth"
      visual={
        <LabLineChart
          data={curve}
          label="Consumption"
          color="var(--chart-2)"
          xUnit="m"
          yUnit="L/min"
          yFractionDigits={0}
          yDomain={[0, calculateGasConsumption(PLAN_LIMITS.sacRate.max, MAX_DEPTH_M)]}
          current={{ x: depth, y: consumption }}
        />
      }
    />
  )
}
