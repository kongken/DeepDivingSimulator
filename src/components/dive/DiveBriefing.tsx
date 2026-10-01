import { ClipboardList, Play } from 'lucide-react'
import { Link } from 'react-router'

import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { canStartDive, getPlanIssues, resolveDiveSetup } from '@/lib/dive-plan'
import { useDiveStore } from '@/store/dive-store'

import { KeyboardLegend } from './KeyboardLegend'
import { PreDiveChecklist } from './PreDiveChecklist'

const DIVE_STEPS = [
  'Hold Deflate to let air out of the BCD and start sinking.',
  'Add short bursts of air as you near your planned depth to level off.',
  'Fine-tune with your breath: inhale to rise a little, exhale to sink.',
  'Watch your gas — deeper means faster consumption.',
  'Ascend no faster than 9 m/min, venting the BCD as the air expands.',
  'Hold 4.5–5.5 m for a 3 minute safety stop, then surface and end the dive.',
] as const

/** Shown on /dive when no dive is running: a final check before descending. */
export function DiveBriefing() {
  const plan = useDiveStore((state) => state.plan)
  const startDive = useDiveStore((state) => state.startDive)
  const setup = resolveDiveSetup(plan)
  const startable = canStartDive(getPlanIssues(setup))

  return (
    <>
      <PageHeader
        eyebrow="Step 2"
        title="Ready to Dive"
        description={`${setup.site.name} · ${plan.maxDepth} m · ${plan.bottomTime} min · ${setup.cylinder.name} at ${plan.startPressure} bar`}
        actions={
          <Button variant="outline" asChild>
            <Link to="/planner">
              <ClipboardList aria-hidden />
              Edit plan
            </Link>
          </Button>
        }
      />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pre-Dive Check</CardTitle>
            <CardDescription>BCD, Weights, Releases, Air, Final OK.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <PreDiveChecklist setup={setup} />
            <Button className="h-11 text-base" onClick={startDive} disabled={!startable}>
              <Play aria-hidden />
              Begin Dive
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>How to dive</CardTitle>
            <CardDescription>
              Depth comes from buoyancy — you never set it directly.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <ol className="grid gap-2 text-sm">
              {DIVE_STEPS.map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="font-mono text-primary">{index + 1}</span>
                  <span className="text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
            <KeyboardLegend />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
