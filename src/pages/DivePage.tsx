import { DiveBriefing } from '@/components/dive/DiveBriefing'
import { DiveSimulator } from '@/components/dive/DiveSimulator'
import { useDiveKeyboard } from '@/hooks/use-dive-keyboard'
import { useSimulationLoop } from '@/hooks/use-simulation-loop'
import { useDiveStore } from '@/store/dive-store'

export default function DivePage() {
  const setup = useDiveStore((state) => state.setup)
  const active = useDiveStore((state) => state.phase !== 'idle')
  useSimulationLoop()
  useDiveKeyboard(active)

  if (!setup || !active) return <DiveBriefing />
  return <DiveSimulator setup={setup} />
}
