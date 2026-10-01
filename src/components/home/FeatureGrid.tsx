import { Atom, Gauge, MoveVertical, Scale } from 'lucide-react'

import { cn } from '@/lib/utils'

const FEATURES = [
  {
    title: 'Buoyancy',
    description: 'Body, lungs, BCD, wetsuit, tank and lead — every kilogram adds up.',
    formula: '1 L displaced ≈ 1 kg',
    Icon: Scale,
  },
  {
    title: 'Gas Management',
    description: 'Consumption scales with depth. Watch your gauge and respect the reserve.',
    formula: '16 L/min × 3 ATA = 48 L/min',
    Icon: Gauge,
  },
  {
    title: 'Ascent Control',
    description: 'Expanding air speeds you up. Vent, slow down and hold the 5 m stop.',
    formula: 'ascent ≤ 9 m/min',
    Icon: MoveVertical,
  },
  {
    title: 'Dive Physics',
    description: "Boyle's law, suit compression and tank weight as live experiments.",
    formula: 'P₁V₁ = P₂V₂',
    Icon: Atom,
  },
] as const

export function FeatureGrid({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        'grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 lg:grid-cols-4',
        className,
      )}
    >
      {FEATURES.map(({ title, description, formula, Icon }) => (
        <div key={title} className="bg-background p-5">
          <Icon className="size-5 text-primary" aria-hidden />
          <h2 className="mt-3 font-medium">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          <code className="mt-3 inline-block rounded bg-muted px-2 py-0.5 font-mono text-xs text-primary">
            {formula}
          </code>
        </div>
      ))}
    </section>
  )
}
