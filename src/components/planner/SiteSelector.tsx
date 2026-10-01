import { Check } from 'lucide-react'

import { DIVE_SITES } from '@/data/dive-sites'
import { CURRENT_LABELS, WATER_TYPE_LABELS } from '@/data/labels'
import { cn } from '@/lib/utils'
import type { DiveSite } from '@/types/dive'

interface SiteSelectorProps {
  value: string
  onChange: (siteId: string) => void
}

export function SiteSelector({ value, onChange }: SiteSelectorProps) {
  return (
    <div role="radiogroup" aria-label="Dive site" className="grid gap-3 md:grid-cols-3">
      {DIVE_SITES.map((site) => (
        <SiteOption
          key={site.id}
          site={site}
          selected={site.id === value}
          onSelect={() => onChange(site.id)}
        />
      ))}
    </div>
  )
}

interface SiteOptionProps {
  site: DiveSite
  selected: boolean
  onSelect: () => void
}

function SiteOption({ site, selected, onSelect }: SiteOptionProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'flex flex-col rounded-lg border p-4 text-left transition-colors outline-none hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50',
        selected && 'border-primary bg-primary/10',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-medium">{site.name}</div>
          <div className="text-xs text-muted-foreground">{site.location}</div>
        </div>
        <span
          className={cn(
            'flex size-5 items-center justify-center rounded-full border',
            selected ? 'border-primary bg-primary text-primary-foreground' : 'border-input',
          )}
        >
          {selected ? <Check className="size-3" aria-hidden /> : null}
        </span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{site.description}</p>
      <dl className="mt-auto grid grid-cols-3 gap-x-3 gap-y-2 pt-3 text-xs">
        <SiteFact label="Depth" value={`${site.maxDepth} m`} />
        <SiteFact label="Water" value={WATER_TYPE_LABELS[site.waterType]} />
        <SiteFact label="Temp" value={`${site.temperature} °C`} />
        <SiteFact label="Vis" value={`${site.visibility} m`} />
        <SiteFact label="Current" value={CURRENT_LABELS[site.current]} />
      </dl>
    </button>
  )
}

function SiteFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.65rem] tracking-wider text-muted-foreground uppercase">{label}</dt>
      <dd className="font-mono tabular-nums">{value}</dd>
    </div>
  )
}
