import { Link, useLocation } from 'react-router'

import { formatNumber } from '@/lib/format'
import { useDiveStore } from '@/store/dive-store'

const DEPTH_DISPLAY_STEP = 10

/** Shows a running dive in the navigation bar so it is never lost. */
export function ActiveDiveIndicator() {
  const location = useLocation()
  const phase = useDiveStore((state) => state.phase)
  // Rounded in the selector so the nav only re-renders when the display changes.
  const depth = useDiveStore((state) =>
    state.simulation
      ? Math.round(state.simulation.depth * DEPTH_DISPLAY_STEP) / DEPTH_DISPLAY_STEP
      : null,
  )

  if (phase === 'idle' || depth === null || location.pathname === '/dive') return null

  return (
    <Link
      to="/dive"
      className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary"
    >
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-primary" />
      </span>
      {phase === 'paused' ? 'Dive paused' : 'Dive in progress'}
      <span className="font-mono tabular-nums">{formatNumber(depth)} m</span>
    </Link>
  )
}
