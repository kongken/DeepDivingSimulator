import { describe, expect, it } from 'vitest'

import { calculateSuitCompressionRatio, calculateWetsuitBuoyancy } from './wetsuit'

describe('calculateWetsuitBuoyancy', () => {
  it('keeps full buoyancy at the surface', () => {
    expect(calculateWetsuitBuoyancy(3.5, 0)).toBeCloseTo(3.5)
  })

  it('wetsuit buoyancy decreases with depth', () => {
    const depths = [0, 5, 10, 20, 30, 40]
    const buoyancy = depths.map((depth) => calculateWetsuitBuoyancy(3.5, depth))
    for (let index = 1; index < buoyancy.length; index += 1) {
      expect(buoyancy[index]).toBeLessThan(buoyancy[index - 1])
    }
  })

  it('uses 1 / P^0.35 by default', () => {
    expect(calculateSuitCompressionRatio(10)).toBeCloseTo(1 / 2 ** 0.35)
  })

  it('no suit means no buoyancy', () => {
    expect(calculateWetsuitBuoyancy(0, 20, 0)).toBe(0)
  })
})
