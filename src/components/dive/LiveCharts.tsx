import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SAFETY_STOP_TRIGGER_DEPTH_M } from '@/lib/physics/constants'
import { useDiveStore } from '@/store/dive-store'
import type { DiveSample, DiveSetup } from '@/types/dive'

import { DiveProfileChart } from './charts/DiveProfileChart'
import { TankPressureChart } from './charts/TankPressureChart'

const NO_SAMPLES: DiveSample[] = []

/** Samples change only every couple of seconds, so the charts re-render rarely. */
function useLiveSamples(): DiveSample[] {
  return useDiveStore((state) => state.simulation?.samples ?? NO_SAMPLES)
}

export function LiveDepthChart({ setup }: { setup: DiveSetup }) {
  const samples = useLiveSamples()
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Depth over Time</CardTitle>
        <CardDescription>Dashed line: planned depth · band: safety stop</CardDescription>
      </CardHeader>
      <CardContent>
        <DiveProfileChart
          samples={samples}
          seabedDepth={setup.site.maxDepth}
          plannedDepth={setup.plan.maxDepth}
          showSafetyBand={setup.site.maxDepth >= SAFETY_STOP_TRIGGER_DEPTH_M}
        />
      </CardContent>
    </Card>
  )
}

export function LiveTankChart({ setup }: { setup: DiveSetup }) {
  const samples = useLiveSamples()
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Tank Pressure over Time</CardTitle>
        <CardDescription>Deeper means steeper — gas use scales with pressure</CardDescription>
      </CardHeader>
      <CardContent>
        <TankPressureChart
          samples={samples}
          startPressure={setup.plan.startPressure}
          reservePressure={setup.plan.reservePressure}
        />
      </CardContent>
    </Card>
  )
}
