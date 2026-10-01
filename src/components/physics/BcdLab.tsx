import { useState } from 'react'

import { SliderField } from '@/components/common/SliderField'
import { StatTile } from '@/components/common/StatTile'
import { formatNumber, formatSigned } from '@/lib/format'
import { calculateBcdVolumeAtDepth, limitBcdVolume } from '@/lib/physics/bcd'
import { BCD_MAX_VOLUME_L } from '@/lib/physics/constants'
import { calculateAmbientPressure } from '@/lib/physics/pressure'

import { LabLayout } from './LabLayout'
import { LabLineChart } from './LabLineChart'
import { sampleCurve } from './curve'

const MIN_START_DEPTH_M = 5
const MAX_START_DEPTH_M = 40
const DEFAULT_START_DEPTH_M = 30
const MIN_START_VOLUME_L = 0.5
const MAX_START_VOLUME_L = 6
const DEFAULT_START_VOLUME_L = 2
const VOLUME_STEP_L = 0.5
const DEPTH_STEP_M = 1
const CURVE_STEP_M = 0.5

export function BcdLab() {
  const [startDepth, setStartDepth] = useState(DEFAULT_START_DEPTH_M)
  const [startVolume, setStartVolume] = useState(DEFAULT_START_VOLUME_L)
  const [selectedDepth, setSelectedDepth] = useState(DEFAULT_START_DEPTH_M)
  const depth = Math.min(selectedDepth, startDepth)

  const volumeAt = (atDepth: number) =>
    limitBcdVolume(calculateBcdVolumeAtDepth(startVolume, startDepth, atDepth))
  const current = volumeAt(depth)
  const curve = sampleCurve(0, startDepth, CURVE_STEP_M, (x) => volumeAt(x).volume)
  const expansion = calculateAmbientPressure(startDepth) / calculateAmbientPressure(depth)

  return (
    <LabLayout
      title="BCD Expansion"
      description="Boyle's law: P₁ · V₁ = P₂ · V₂"
      controls={
        <>
          <SliderField
            id="lab-bcd-start-depth"
            label="Start depth"
            unit="m"
            value={startDepth}
            min={MIN_START_DEPTH_M}
            max={MAX_START_DEPTH_M}
            step={DEPTH_STEP_M}
            onChange={(value) => {
              setStartDepth(value)
              setSelectedDepth(value)
            }}
          />
          <SliderField
            id="lab-bcd-start-volume"
            label="Air in BCD at start"
            unit="L"
            fractionDigits={1}
            value={startVolume}
            min={MIN_START_VOLUME_L}
            max={MAX_START_VOLUME_L}
            step={VOLUME_STEP_L}
            onChange={setStartVolume}
          />
          <SliderField
            id="lab-bcd-depth"
            label="Ascend to"
            unit="m"
            value={depth}
            min={0}
            max={startDepth}
            step={DEPTH_STEP_M}
            inverted
            hint="Drag right to rise towards the surface without venting."
            onChange={setSelectedDepth}
          />
        </>
      }
      insight={
        <>
          The same air takes up more room as pressure drops. From 10 m to the surface it doubles —
          that is why an ascent speeds itself up unless you vent the BCD on the way.
        </>
      }
      readouts={
        <>
          <StatTile label="Depth" value={depth} unit="m" />
          <StatTile
            label="BCD Volume"
            value={formatNumber(current.volume)}
            unit="L"
            tone={current.vented ? 'warning' : 'info'}
            hint={current.vented ? 'full — valve venting' : undefined}
          />
          <StatTile label="Expansion" value={`×${formatNumber(expansion)}`} />
          <StatTile
            label="Extra lift"
            value={formatSigned(current.volume - startVolume)}
            unit="kg"
            tone="info"
          />
        </>
      }
      visualTitle="BCD volume vs depth"
      visual={
        <LabLineChart
          data={curve}
          label="BCD volume"
          color="var(--chart-1)"
          xUnit="m"
          yUnit="L"
          xReversed
          yDomain={[0, BCD_MAX_VOLUME_L]}
          current={{ x: depth, y: current.volume }}
          referenceLines={[
            {
              y: BCD_MAX_VOLUME_L,
              label: 'BCD full — over-pressure valve vents',
              color: 'var(--warning)',
            },
          ]}
        />
      }
    />
  )
}
