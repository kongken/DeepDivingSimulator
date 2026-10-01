import { useEffect } from 'react'
import { useLocation } from 'react-router'

import { useDiveStore } from '@/store/dive-store'

const DIVE_PATH = '/dive'

/**
 * The simulation only ticks while the dive page is mounted. Pause it when the diver
 * navigates elsewhere so the dive is honestly "paused" rather than silently frozen.
 */
export function usePauseDiveOffscreen(): void {
  const { pathname } = useLocation()
  const pauseDive = useDiveStore((state) => state.pauseDive)

  useEffect(() => {
    if (pathname !== DIVE_PATH) pauseDive()
  }, [pathname, pauseDive])
}
