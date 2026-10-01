import { useEffect } from 'react'

import { useDiveStore } from '@/store/dive-store'

/** Frames longer than this (e.g. after a background tab) are capped to avoid a jump. */
const MAX_FRAME_DELTA_S = 0.1
const MS_PER_SECOND = 1000

/** Drives the dive simulation with requestAnimationFrame while a dive is running. */
export function useSimulationLoop(): void {
  const phase = useDiveStore((state) => state.phase)
  const tick = useDiveStore((state) => state.tick)

  useEffect(() => {
    if (phase !== 'running') return

    let frameId = 0
    let lastTime = performance.now()
    const onFrame = (now: number) => {
      tick(Math.min((now - lastTime) / MS_PER_SECOND, MAX_FRAME_DELTA_S))
      lastTime = now
      frameId = requestAnimationFrame(onFrame)
    }
    frameId = requestAnimationFrame(onFrame)
    return () => cancelAnimationFrame(frameId)
  }, [phase, tick])
}
