import { describe, expect, it } from 'vitest'

import { calculateTerminalVelocity, integrateVerticalMotion } from './motion'

function settle(forceKg: number, seconds: number, depth = 20) {
  let motion = { depth, velocity: 0 }
  const dt = 0.05
  for (let time = 0; time < seconds; time += dt) {
    motion = integrateVerticalMotion(motion, forceKg, dt, 40)
  }
  return motion
}

describe('integrateVerticalMotion', () => {
  it('positive buoyancy makes the diver rise, negative makes them sink', () => {
    expect(settle(1, 2).depth).toBeLessThan(20)
    expect(settle(-1, 2).depth).toBeGreaterThan(20)
  })

  it('a small change builds speed over a few seconds, not instantly', () => {
    const afterHalfSecond = settle(1.5, 0.5).velocity
    const afterFiveSeconds = settle(1.5, 5).velocity
    expect(afterHalfSecond).toBeLessThan(afterFiveSeconds * 0.5)
  })

  it('drag limits the speed to the terminal velocity', () => {
    expect(settle(1, 30).velocity).toBeCloseTo(calculateTerminalVelocity(1), 3)
  })

  it('stops at the surface and on the seabed', () => {
    const surface = integrateVerticalMotion({ depth: 0.01, velocity: 1 }, 5, 0.1, 40)
    expect(surface).toMatchObject({ depth: 0, velocity: 0, atSurface: true })

    const seabed = integrateVerticalMotion({ depth: 39.99, velocity: -1 }, -5, 0.1, 40)
    expect(seabed).toMatchObject({ depth: 40, velocity: 0, onSeabed: true })
  })
})
