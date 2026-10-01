const SAMPLE_READOUTS = [
  { label: 'Dive time', value: '22:31', unit: '' },
  { label: 'Tank', value: '143', unit: 'bar' },
  { label: 'Gas', value: '1587', unit: 'L' },
  { label: 'Ascent', value: '↑ 6.2', unit: 'm/min' },
  { label: 'Ambient', value: '2.84', unit: 'ATA' },
  { label: 'Net buoyancy', value: '+0.3', unit: 'kg' },
] as const

/** Static example readout that previews the dive computer on the home page. */
export function HeroComputer() {
  return (
    <figure
      className="rounded-2xl border bg-card p-5 shadow-2xl shadow-black/30"
      aria-label="Example dive computer readout"
    >
      <div className="flex items-center justify-between text-[0.7rem] font-semibold tracking-widest text-muted-foreground uppercase">
        <span>Racha Yai · Salt</span>
        <span className="rounded-full border border-success/40 bg-success/10 px-2 py-0.5 text-success">
          Normal
        </span>
      </div>
      <div className="mt-4">
        <div className="text-[0.7rem] font-medium tracking-widest text-muted-foreground uppercase">
          Depth
        </div>
        <div className="font-mono text-6xl tabular-nums">
          18.4<span className="ml-2 text-2xl text-muted-foreground">m</span>
        </div>
      </div>
      <dl className="mt-5 grid grid-cols-3 gap-x-4 gap-y-4 border-t pt-4">
        {SAMPLE_READOUTS.map(({ label, value, unit }) => (
          <div key={label}>
            <dt className="text-[0.65rem] font-medium tracking-widest text-muted-foreground uppercase">
              {label}
            </dt>
            <dd className="font-mono text-xl tabular-nums">
              {value}
              {unit ? <span className="ml-1 text-xs text-muted-foreground">{unit}</span> : null}
            </dd>
          </div>
        ))}
      </dl>
    </figure>
  )
}
