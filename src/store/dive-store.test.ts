import { beforeEach, describe, expect, it } from 'vitest'

import { DEFAULT_PLAN } from '@/lib/dive-plan'

import { MAX_STORED_LOGS, useDiveStore } from './dive-store'

const FRAME_S = 0.1

function advance(seconds: number) {
  const frames = Math.round(seconds / FRAME_S)
  for (let frame = 0; frame < frames; frame += 1) useDiveStore.getState().tick(FRAME_S)
}

function depth(): number {
  return useDiveStore.getState().simulation?.depth ?? 0
}

describe('useDiveStore', () => {
  beforeEach(() => {
    useDiveStore.setState({ plan: DEFAULT_PLAN, logs: [], timeScale: 1 })
    useDiveStore.getState().resetDive()
  })

  it('keeps plan edits within the site and cylinder limits', () => {
    useDiveStore.getState().updatePlan({ siteId: 'training-pool' })
    expect(useDiveStore.getState().plan.maxDepth).toBe(5)
  })

  it('freezes the plan when the dive starts', () => {
    const { startDive, updatePlan } = useDiveStore.getState()
    startDive()
    updatePlan({ weightKg: 10 })
    expect(useDiveStore.getState().setup?.plan.weightKg).toBe(DEFAULT_PLAN.weightKg)
  })

  it('only advances while running', () => {
    const { startDive, togglePause } = useDiveStore.getState()
    startDive()
    advance(1)
    const elapsed = useDiveStore.getState().simulation?.elapsedSeconds ?? 0
    expect(elapsed).toBeGreaterThan(0.9)

    togglePause()
    advance(1)
    expect(useDiveStore.getState().simulation?.elapsedSeconds).toBe(elapsed)
  })

  it('scales simulated time with the speed setting', () => {
    const { startDive, setTimeScale } = useDiveStore.getState()
    startDive()
    setTimeScale(4)
    advance(1)
    expect(useDiveStore.getState().simulation?.elapsedSeconds).toBeCloseTo(4, 1)
  })

  it('logs the dive only once the diver is back at the surface', () => {
    const { startDive, setControl, endDive } = useDiveStore.getState()
    startDive()
    expect(endDive()).toBeNull()

    setControl('deflate', true)
    advance(5)
    setControl('deflate', false)
    advance(10)
    expect(useDiveStore.getState().simulation?.hasDescended).toBe(true)
    expect(endDive()).toBeNull()

    // Add air and let the expanding BCD carry the diver back up.
    setControl('inflate', true)
    advance(4)
    setControl('inflate', false)
    for (let step = 0; step < 1200 && depth() > 0.2; step += 1) advance(FRAME_S)

    const log = endDive()
    expect(log).not.toBeNull()
    expect(useDiveStore.getState().phase).toBe('idle')
    expect(useDiveStore.getState().logs[0]?.id).toBe(log?.id)
  })

  it(`keeps at most ${MAX_STORED_LOGS} logs`, () => {
    const { startDive } = useDiveStore.getState()
    startDive()
    const simulation = useDiveStore.getState().simulation
    if (!simulation) throw new Error('dive did not start')
    for (let dive = 0; dive < MAX_STORED_LOGS + 3; dive += 1) {
      useDiveStore.setState({ simulation: { ...simulation, hasDescended: true, depth: 0 } })
      useDiveStore.getState().endDive()
      useDiveStore.getState().startDive()
    }
    expect(useDiveStore.getState().logs).toHaveLength(MAX_STORED_LOGS)
  })
})
