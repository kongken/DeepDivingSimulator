import { describe, expect, it } from 'vitest'

import { calculateAmbientPressure, calculateDepthForPressure } from './pressure'

describe('calculateAmbientPressure', () => {
  it.each([
    [0, 1],
    [10, 2],
    [20, 3],
    [30, 4],
    [40, 5],
  ])('%i m = %i ATA', (depth, pressure) => {
    expect(calculateAmbientPressure(depth)).toBeCloseTo(pressure)
  })

  it('never reports less than surface pressure', () => {
    expect(calculateAmbientPressure(-2)).toBe(1)
  })

  it('is the inverse of calculateDepthForPressure', () => {
    expect(calculateDepthForPressure(calculateAmbientPressure(18.4))).toBeCloseTo(18.4)
  })
})
