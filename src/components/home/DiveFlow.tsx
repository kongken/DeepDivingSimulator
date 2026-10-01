import { ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'

const STEPS = [
  'Dive Planner',
  'Pre-Dive Check',
  'Dive Simulator',
  'Safety Stop',
  'Dive Log',
] as const

export function DiveFlow({ className }: { className?: string }) {
  return (
    <section className={cn('text-center', className)}>
      <h2 className="text-xs font-semibold tracking-[0.25em] text-muted-foreground uppercase">
        One complete dive
      </h2>
      <ol className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
        {STEPS.map((step, index) => (
          <li key={step} className="flex items-center gap-2">
            {index > 0 ? (
              <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
            ) : null}
            <span className="rounded-full border px-3 py-1">
              <span className="mr-1.5 font-mono text-xs text-primary">{index + 1}</span>
              {step}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
