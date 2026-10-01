import { describe, expect, it } from 'vitest'

import { DEFAULT_PLAN, resolveDiveSetup } from '@/lib/dive-plan'
import { getDiveAlerts } from '@/lib/dive-status'
import type { ControlInputs, DepthExcursion, SimulationState } from '@/types/dive'

import { SAFETY_STOP_DURATION_S } from './constants'
import { calculateAmbientPressure } from './pressure'
import {
  IDLE_CONTROLS,
  calculateNeutralBcdVolume,
  canEndDive,
  createInitialSimulation,
  stepSimulation,
  trackDepthExcursion,
} from './simulation'

// Scenario setup: AL80, 200 bar, SAC 16 L/min, 20 m plan at Racha Yai.
const setup = resolveDiveSetup(DEFAULT_PLAN)
const FRAME_S = 0.1
const HOVER_LOOKAHEAD_S = 4
const HOVER_DEADBAND_M = 0.1

function diverAt(depth: number, overrides: Partial<SimulationState> = {}): SimulationState {
  return {
    ...createInitialSimulation(setup),
    depth,
    maxDepth: depth,
    hasDescended: true,
    bcdVolume: calculateNeutralBcdVolume(setup, depth, setup.plan.startPressure),
    ...overrides,
  }
}

type Pilot = ControlInputs | ((state: SimulationState) => ControlInputs)

function run(
  state: SimulationState,
  seconds: number,
  pilot: Pilot = IDLE_CONTROLS,
  onFrame?: (state: SimulationState) => void,
): SimulationState {
  let next = state
  const frames = Math.round(seconds / FRAME_S)
  for (let frame = 0; frame < frames; frame += 1) {
    const controls = typeof pilot === 'function' ? pilot(next) : pilot
    next = stepSimulation(next, controls, setup, FRAME_S)
    onFrame?.(next)
  }
  return next
}

/** A diver who holds a depth with small BCD corrections, like a real diver would. */
function hoverAt(targetDepth: number): Pilot {
  return (state) => {
    const predictedDepth = state.depth - state.verticalVelocity * HOVER_LOOKAHEAD_S
    return {
      ...IDLE_CONTROLS,
      inflate: predictedDepth > targetDepth + HOVER_DEADBAND_M,
      deflate: predictedDepth < targetDepth - HOVER_DEADBAND_M,
    }
  }
}

describe('Scenario A — gas consumption at depth', () => {
  it('at 20 m: ambient ≈ 3 ATA and consumption ≈ 48 L/min', () => {
    const state = run(diverAt(20), 1)
    expect(calculateAmbientPressure(state.depth)).toBeCloseTo(3, 1)
    expect(state.gasConsumptionLpm).toBeCloseTo(48, 0)
  })

  it('uses ≈ 24 L of gas in 30 s at 20 m', () => {
    const start = diverAt(20)
    const state = run(start, 30)
    expect(start.gasRemainingLiters - state.gasRemainingLiters).toBeCloseTo(24, 0)
    expect(state.tankPressure).toBeLessThan(start.tankPressure)
  })

  it('a neutral diver slowly drifts up as the tank gets lighter', () => {
    const state = run(diverAt(20), 60)
    expect(state.depth).toBeLessThan(20)
    expect(state.depth).toBeGreaterThan(18)
  })
})

describe('Scenario B/C — runaway ascent', () => {
  it('BCD expands and the ascent accelerates if the diver does not vent', () => {
    const start = diverAt(20)
    const neutralVolume = start.bcdVolume
    const checkpoints = new Map<number, SimulationState>()

    run({ ...start, bcdVolume: neutralVolume + 1 }, 120, IDLE_CONTROLS, (state) => {
      for (const depth of [17, 10]) {
        if (!checkpoints.has(depth) && state.depth <= depth) checkpoints.set(depth, state)
      }
    })

    const at17 = checkpoints.get(17)
    const at10 = checkpoints.get(10)
    expect(at17).toBeDefined()
    expect(at10).toBeDefined()
    if (!at17 || !at10) return

    expect(at10.bcdVolume).toBeGreaterThan(at17.bcdVolume)
    expect(at17.bcdVolume).toBeGreaterThan(neutralVolume + 1)
    expect(at10.ascentRate).toBeGreaterThan(at17.ascentRate)
    expect(at10.netBuoyancyKg).toBeGreaterThan(at17.netBuoyancyKg)
  })

  it('raises ASCENT TOO FAST above 9 m/min', () => {
    const start = diverAt(20)
    let sawFastAscent = false
    run({ ...start, bcdVolume: start.bcdVolume + 1 }, 60, IDLE_CONTROLS, (state) => {
      const ids = getDiveAlerts(state, setup).map((alert) => alert.id)
      if (state.ascentRate > 9 && state.ascentRate <= 12) {
        expect(ids).toContain('fast-ascent')
        sawFastAscent = true
      }
      if (state.ascentRate > 12) expect(ids).toContain('dangerous-ascent')
    })
    expect(sawFastAscent).toBe(true)
  })

  it('venting the BCD stops the runaway', () => {
    const start = diverAt(20)
    const vented = run({ ...start, bcdVolume: start.bcdVolume + 1 }, 6, {
      ...IDLE_CONTROLS,
      deflate: true,
    })
    const after = run(vented, 10)
    expect(after.ascentRate).toBeLessThan(0)
  })
})

describe('Scenario D — safety stop', () => {
  it('counts down at 5 m and pauses outside 4.5–5.5 m', () => {
    const atStop = run(diverAt(5, { maxDepth: 20 }), 10)
    expect(atStop.safetyStop.status).toBe('in-progress')
    expect(atStop.safetyStop.remainingSeconds).toBeCloseTo(SAFETY_STOP_DURATION_S - 10, 0)

    const shallow = run(
      diverAt(3.5, {
        maxDepth: 20,
        safetyStop: atStop.safetyStop,
      }),
      5,
    )
    expect(shallow.safetyStop.status).toBe('paused')
    expect(shallow.safetyStop.remainingSeconds).toBeCloseTo(atStop.safetyStop.remainingSeconds)
  })

  it('completes after three minutes holding 5 m', () => {
    const done = run(diverAt(5, { maxDepth: 20 }), SAFETY_STOP_DURATION_S + 1, hoverAt(5))
    expect(done.safetyStop.status).toBe('complete')
  })
})

describe('Scenario E — the tank gets lighter', () => {
  it('a 50 bar tank leaves the diver ≈ 2 kg more buoyant than at 200 bar', () => {
    const full = stepSimulation(diverAt(10), IDLE_CONTROLS, setup, FRAME_S)
    const nearlyEmpty = stepSimulation(
      diverAt(10, { gasRemainingLiters: setup.cylinder.waterVolume * 50 }),
      IDLE_CONTROLS,
      setup,
      FRAME_S,
    )

    expect(nearlyEmpty.buoyancy.gas).toBeGreaterThan(full.buoyancy.gas)
    expect(nearlyEmpty.netBuoyancyKg - full.netBuoyancyKg).toBeCloseTo(2.04, 1)
  })
})

describe('simulation loop', () => {
  it('is independent of the frame rate', () => {
    const start = diverAt(20)
    const lifted = { ...start, bcdVolume: start.bcdVolume + 1 }
    const oneFrame = stepSimulation(lifted, IDLE_CONTROLS, setup, 2)
    let manyFrames = lifted
    for (let frame = 0; frame < 200; frame += 1) {
      manyFrames = stepSimulation(manyFrames, IDLE_CONTROLS, setup, 0.01)
    }
    expect(oneFrame.depth).toBeCloseTo(manyFrames.depth, 2)
    expect(oneFrame.gasRemainingLiters).toBeCloseTo(manyFrames.gasRemainingLiters, 2)
  })

  it('floats at the surface until the BCD is deflated', () => {
    const floating = run(createInitialSimulation(setup), 10)
    expect(floating.depth).toBe(0)
    expect(floating.hasDescended).toBe(false)
    expect(floating.diveTimeSeconds).toBe(0)

    const descending = run(run(floating, 5, { ...IDLE_CONTROLS, deflate: true }), 20)
    expect(descending.depth).toBeGreaterThan(1)
    expect(descending.hasDescended).toBe(true)
    expect(descending.diveTimeSeconds).toBeGreaterThan(0)
    expect(descending.samples.length).toBeGreaterThan(0)
  })

  it('allows ending the dive once back at the surface', () => {
    expect(canEndDive(createInitialSimulation(setup))).toBe(false)
    expect(canEndDive(diverAt(0.2))).toBe(true)
    expect(canEndDive(diverAt(6))).toBe(false)
  })

  it('tracks gas sent into the BCD separately from breathing gas', () => {
    const start = diverAt(20)
    const inflated = run(start, 1, { ...IDLE_CONTROLS, inflate: true })
    // 1 L/s of BCD volume at 3 ATA draws ≈ 3 surface liters from the tank.
    expect(inflated.stats.bcdGasLiters).toBeCloseTo(3, 0)
    expect(start.gasRemainingLiters - inflated.gasRemainingLiters).toBeGreaterThan(
      inflated.stats.bcdGasLiters,
    )
  })

  it('keeps simulating when the tank is empty', () => {
    const empty = run(diverAt(10, { gasRemainingLiters: 0.5 }), 5)
    expect(empty.tankPressure).toBe(0)
    expect(empty.stats.outOfGas).toBe(true)
    expect(empty.elapsedSeconds).toBeGreaterThan(4.9)
  })
})

describe('trackDepthExcursion', () => {
  it('counts direction changes larger than 3 m', () => {
    let excursion: DepthExcursion = { direction: 0, extremeDepth: 0 }
    let reversals = 0
    for (const depth of [5, 20, 18, 16, 21, 10, 12, 0]) {
      const update = trackDepthExcursion(excursion, depth)
      excursion = update.excursion
      if (update.reversed) reversals += 1
    }
    // 20 → 16 (up), 16 → 21 (down), 21 → 10 (up). The 10 → 12 wiggle is ignored.
    expect(reversals).toBe(3)
  })
})
