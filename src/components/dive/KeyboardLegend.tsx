import { cn } from '@/lib/utils'

const SHORTCUTS = [
  { keys: ['W'], action: 'Inhale' },
  { keys: ['S'], action: 'Exhale' },
  { keys: ['Space'], action: 'Inflate BCD' },
  { keys: ['Shift'], action: 'Deflate BCD' },
  { keys: ['↑', '↓'], action: 'Fin up / down' },
  { keys: ['P'], action: 'Pause' },
] as const

export function KeyboardLegend({ className }: { className?: string }) {
  return (
    <dl className={cn('grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs', className)}>
      {SHORTCUTS.map(({ keys, action }) => (
        <div key={action} className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">{action}</dt>
          <dd className="flex gap-1">
            {keys.map((key) => (
              <kbd
                key={key}
                className="min-w-6 rounded border border-b-2 bg-muted px-1.5 py-0.5 text-center font-mono text-[0.7rem]"
              >
                {key}
              </kbd>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  )
}
