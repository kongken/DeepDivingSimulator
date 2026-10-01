import { ClipboardList, FlaskConical, NotebookPen } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'

import { PageHeader } from '@/components/common/PageHeader'
import { DiveProfileChart } from '@/components/dive/charts/DiveProfileChart'
import { TankPressureChart } from '@/components/dive/charts/TankPressureChart'
import { AssessmentGrid } from '@/components/log/AssessmentGrid'
import { LogHistory } from '@/components/log/LogHistory'
import { LogStats } from '@/components/log/LogStats'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getDiveSite } from '@/data/dive-sites'
import { formatDateTime } from '@/lib/format'
import { SAFETY_STOP_TRIGGER_DEPTH_M } from '@/lib/physics/constants'
import { useDiveStore } from '@/store/dive-store'

export default function DiveLogPage() {
  const logs = useDiveStore((state) => state.logs)
  const deleteLog = useDiveStore((state) => state.deleteLog)
  const [searchParams, setSearchParams] = useSearchParams()

  const log = logs.find((entry) => entry.id === searchParams.get('id')) ?? logs[0]
  if (!log) return <EmptyLog />

  const isLatest = log.id === logs[0].id
  const seabedDepth = getDiveSite(log.siteId).maxDepth

  return (
    <>
      <PageHeader
        eyebrow={isLatest ? 'Step 3 · Dive Log' : 'Dive Log'}
        title={isLatest ? 'Dive Complete' : log.siteName}
        description={`${log.siteName} · ${formatDateTime(log.endedAt)} · ${log.cylinderName} · ${log.suitName} · ${log.plan.weightKg} kg`}
        actions={
          <>
            <Button asChild>
              <Link to="/planner">
                <ClipboardList aria-hidden />
                Plan another dive
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/physics">
                <FlaskConical aria-hidden />
                Physics Lab
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-6">
          <LogStats log={log} />
          <AssessmentGrid log={log} />
          <div className="grid gap-4 md:grid-cols-2">
            <Card size="sm">
              <CardHeader>
                <CardTitle>Dive Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <DiveProfileChart
                  samples={log.profile}
                  seabedDepth={seabedDepth}
                  plannedDepth={log.plan.maxDepth}
                  showSafetyBand={seabedDepth >= SAFETY_STOP_TRIGGER_DEPTH_M}
                />
              </CardContent>
            </Card>
            <Card size="sm">
              <CardHeader>
                <CardTitle>Tank Pressure</CardTitle>
              </CardHeader>
              <CardContent>
                <TankPressureChart
                  samples={log.profile}
                  startPressure={log.startPressure}
                  reservePressure={log.plan.reservePressure}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <LogHistory
          logs={logs}
          selectedId={log.id}
          onSelect={(id) => setSearchParams({ id })}
          onDelete={deleteLog}
        />
      </div>
    </>
  )
}

function EmptyLog() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
      <NotebookPen className="size-8 text-muted-foreground" aria-hidden />
      <h1 className="text-xl font-semibold">No dives logged yet</h1>
      <p className="text-sm text-muted-foreground">
        Plan a dive, complete it, and end it at the surface — your log appears here with a profile
        and a skills review.
      </p>
      <Button asChild>
        <Link to="/planner">
          <ClipboardList aria-hidden />
          Plan a Dive
        </Link>
      </Button>
    </div>
  )
}
