import { Flag, Pause, Play, X } from 'lucide-react'
import { useNavigate } from 'react-router'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { canEndDive } from '@/lib/physics/simulation'
import { useDiveStore } from '@/store/dive-store'
import type { DiveSetup, TimeScale } from '@/types/dive'

const TIME_SCALES: readonly TimeScale[] = [1, 2, 4]

export function SimulationToolbar({ setup }: { setup: DiveSetup }) {
  const navigate = useNavigate()
  const paused = useDiveStore((state) => state.phase === 'paused')
  const timeScale = useDiveStore((state) => state.timeScale)
  const canEnd = useDiveStore((state) => (state.simulation ? canEndDive(state.simulation) : false))
  const setTimeScale = useDiveStore((state) => state.setTimeScale)
  const togglePause = useDiveStore((state) => state.togglePause)
  const endDive = useDiveStore((state) => state.endDive)
  const resetDive = useDiveStore((state) => state.resetDive)

  const { plan, site } = setup

  const finishDive = () => {
    const log = endDive()
    if (log) navigate(`/log?id=${log.id}`)
  }
  const abortDive = () => {
    resetDive()
    navigate('/planner')
  }
  const changeTimeScale = (value: string) => {
    const next = TIME_SCALES.find((scale) => String(scale) === value)
    if (next) setTimeScale(next)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="mr-auto">
        <h1 className="text-xl font-semibold tracking-tight">Dive Simulator</h1>
        <p className="text-xs text-muted-foreground">
          {site.name} · plan {plan.maxDepth} m for {plan.bottomTime} min · SAC {plan.sacRate} L/min
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        Speed
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={String(timeScale)}
          onValueChange={changeTimeScale}
          aria-label="Simulation speed"
        >
          {TIME_SCALES.map((scale) => (
            <ToggleGroupItem key={scale} value={String(scale)} className="font-mono">
              {scale}×
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <Button variant="outline" onClick={togglePause}>
        {paused ? <Play aria-hidden /> : <Pause aria-hidden />}
        {paused ? 'Resume' : 'Pause'}
      </Button>

      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={canEnd ? undefined : 0}>
            <Button onClick={finishDive} disabled={!canEnd}>
              <Flag aria-hidden />
              End Dive
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {canEnd ? 'Log this dive' : 'Return to the surface to end the dive'}
        </TooltipContent>
      </Tooltip>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" aria-label="Abort dive">
            <X aria-hidden />
            Abort
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Abort this dive?</DialogTitle>
            <DialogDescription>
              The simulation stops and nothing is written to your dive log.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Keep diving</Button>
            </DialogClose>
            <Button variant="destructive" onClick={abortDive}>
              Abort dive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
