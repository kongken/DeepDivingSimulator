import { RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router'

import { PageHeader } from '@/components/common/PageHeader'
import { DivePlanFields } from '@/components/planner/DivePlanFields'
import { EquipmentFields } from '@/components/planner/EquipmentFields'
import { PlanSummary } from '@/components/planner/PlanSummary'
import { PreDiveCheckDialog } from '@/components/planner/PreDiveCheckDialog'
import { SiteSelector } from '@/components/planner/SiteSelector'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { canStartDive, getPlanIssues, resolveDiveSetup } from '@/lib/dive-plan'
import { useDiveStore } from '@/store/dive-store'

export default function PlannerPage() {
  const navigate = useNavigate()
  const plan = useDiveStore((state) => state.plan)
  const hasActiveDive = useDiveStore((state) => state.phase !== 'idle')
  const updatePlan = useDiveStore((state) => state.updatePlan)
  const resetPlan = useDiveStore((state) => state.resetPlan)
  const startDive = useDiveStore((state) => state.startDive)

  const setup = resolveDiveSetup(plan)
  const startable = canStartDive(getPlanIssues(setup))

  const beginDive = () => {
    startDive()
    navigate('/dive')
  }

  return (
    <>
      <PageHeader
        eyebrow="Step 1"
        title="Dive Planner"
        description="Choose a site, plan your depth and time, and pick your kit. The summary updates as you go."
        actions={
          <Button variant="ghost" onClick={resetPlan}>
            <RotateCcw aria-hidden />
            Reset to defaults
          </Button>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Dive Site</CardTitle>
              <CardDescription>The seabed limits how deep you can go.</CardDescription>
            </CardHeader>
            <CardContent>
              <SiteSelector value={plan.siteId} onChange={(siteId) => updatePlan({ siteId })} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dive Plan</CardTitle>
              <CardDescription>Depth, time and gas limits for this dive.</CardDescription>
            </CardHeader>
            <CardContent>
              <DivePlanFields setup={setup} onChange={updatePlan} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Equipment</CardTitle>
              <CardDescription>
                Cylinder, exposure suit and lead all change your buoyancy.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EquipmentFields setup={setup} onChange={updatePlan} />
            </CardContent>
          </Card>
        </div>

        <Card className="lg:sticky lg:top-20">
          <CardHeader>
            <CardTitle>Plan Summary</CardTitle>
            <CardDescription>
              {setup.site.name} · {plan.maxDepth} m · {plan.bottomTime} min
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PlanSummary
              setup={setup}
              action={
                <PreDiveCheckDialog
                  setup={setup}
                  disabled={!startable}
                  hasActiveDive={hasActiveDive}
                  onConfirm={beginDive}
                />
              }
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
