import type { DiveSetup } from '@/types/dive'

import { BuoyancyPanel } from './BuoyancyPanel'
import { ControlPanel } from './ControlPanel'
import { DepthView } from './DepthView'
import { DiveAlerts } from './DiveAlerts'
import { DiveComputer } from './DiveComputer'
import { LiveDepthChart, LiveTankChart } from './LiveCharts'
import { SimulationToolbar } from './SimulationToolbar'

export function DiveSimulator({ setup }: { setup: DiveSetup }) {
  return (
    <div className="grid gap-4">
      <SimulationToolbar setup={setup} />
      <DiveComputer setup={setup} />
      <DiveAlerts setup={setup} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <DepthView setup={setup} />
        <ControlPanel />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <LiveDepthChart setup={setup} />
        <LiveTankChart setup={setup} />
        <div className="md:col-span-2 xl:col-span-1">
          <BuoyancyPanel />
        </div>
      </div>
    </div>
  )
}
