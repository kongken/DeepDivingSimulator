import { useState } from 'react'

import { SliderField } from '@/components/common/SliderField'
import { StatTile } from '@/components/common/StatTile'
import { formatNumber } from '@/lib/format'
import { calculateAmbientPressure } from '@/lib/physics/pressure'

import { LabLayout } from './LabLayout'
import { LabLineChart } from './LabLineChart'
import { sampleCurve } from './curve'

const MAX_DEPTH_M = 40
const DEPTH_STEP_M = 1
const DEFAULT_DEPTH_M = 20
/** A lungful of air taken at the surface, used to illustrate compression. */
const SURFACE_BALLOON_L = 6

const PRESSURE_CURVE = sampleCurve(0, MAX_DEPTH_M, DEPTH_STEP_M, calculateAmbientPressure)

export function PressureLab() {
  const [depth, setDepth] = useState(DEFAULT_DEPTH_M)
  const pressure = calculateAmbientPressure(depth)

  return (
    <LabLayout
      title="Pressure"
      description="Ambient pressure = depth / 10 + 1"
      controls={
        <SliderField
          id="lab-pressure-depth"
          label="Depth"
          unit="m"
          value={depth}
          min={0}
          max={MAX_DEPTH_M}
          step={DEPTH_STEP_M}
          onChange={setDepth}
        />
      }
      insight={
        <>
          Every 10 m of water adds another atmosphere. The first 10 m double the pressure — the
          biggest relative change of the whole dive happens right below the surface.
        </>
      }
      readouts={
        <>
          <StatTile label="Depth" value={depth} unit="m" />
          <StatTile label="Pressure" value={formatNumber(pressure, 1)} unit="ATA" tone="info" />
          <StatTile
            label="Air per breath"
            value={`×${formatNumber(pressure, 1)}`}
            hint="vs. the same breath at the surface"
          />
          <StatTile
            label={`${SURFACE_BALLOON_L} L balloon`}
            value={formatNumber(SURFACE_BALLOON_L / pressure)}
            unit="L"
            hint="filled at the surface, carried down"
          />
        </>
      }
      visualTitle="Depth vs Ambient Pressure"
      visual={
        <LabLineChart
          data={PRESSURE_CURVE}
          label="Pressure"
          color="var(--chart-1)"
          xUnit="m"
          yUnit="ATA"
          yDomain={[0, calculateAmbientPressure(MAX_DEPTH_M)]}
          current={{ x: depth, y: pressure }}
        />
      }
    />
  )
}
