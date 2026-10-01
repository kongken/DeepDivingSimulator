import { CircleCheck, TriangleAlert } from 'lucide-react'

import { getPreDiveChecks } from '@/lib/dive-plan'
import type { DiveSetup } from '@/types/dive'

export function PreDiveChecklist({ setup }: { setup: DiveSetup }) {
  return (
    <ol className="grid gap-2">
      {getPreDiveChecks(setup).map((check) => (
        <li key={check.id} className="flex gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
          {check.status === 'ok' ? (
            <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" aria-label="OK" />
          ) : (
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-caution" aria-label="Check" />
          )}
          <div>
            <div className="text-sm font-medium">{check.label}</div>
            <div className="text-xs text-muted-foreground">{check.detail}</div>
          </div>
        </li>
      ))}
    </ol>
  )
}
