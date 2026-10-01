import { Gauge, MoveVertical, Scale } from 'lucide-react'

import { RATING_LABEL, RATING_TONE, TONE_SURFACE } from '@/components/common/tone'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Assessment, DiveLog } from '@/types/dive'

const ASSESSMENTS = [
  { key: 'buoyancy', title: 'Buoyancy Control', Icon: Scale },
  { key: 'ascent', title: 'Ascent Control', Icon: MoveVertical },
  { key: 'gas', title: 'Gas Management', Icon: Gauge },
] as const

export function AssessmentGrid({ log }: { log: DiveLog }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {ASSESSMENTS.map(({ key, title, Icon }) => (
        <AssessmentCard key={key} title={title} Icon={Icon} assessment={log.assessments[key]} />
      ))}
    </div>
  )
}

interface AssessmentCardProps {
  title: string
  Icon: typeof Scale
  assessment: Assessment
}

function AssessmentCard({ title, Icon, assessment }: AssessmentCardProps) {
  const tone = RATING_TONE[assessment.rating]
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" aria-hidden />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <span
          className={cn(
            'w-fit rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wider uppercase',
            TONE_SURFACE[tone],
          )}
        >
          {RATING_LABEL[assessment.rating]}
        </span>
        <ul className="grid gap-1 text-sm text-muted-foreground">
          {assessment.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
