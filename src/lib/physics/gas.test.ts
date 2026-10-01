import { describe, expect, it } from 'vitest'

import {
  calculateGasConsumption,
  calculateGasDurationMinutes,
  calculateGasVolume,
  calculateTankPressure,
  consumeGas,
} from './gas'

const AL80_VOLUME = 11.1

describe('calculateGasConsumption', () => {
  it('SAC 16 @ 20 m ≈ 48 L/min', () => {
    expect(calculateGasConsumption(16, 20)).toBeCloseTo(48)
  })

  it('equals the SAC at the surface', () => {
    expect(calculateGasConsumption(16, 0)).toBeCloseTo(16)
  })

  it('scales with workload', () => {
    expect(calculateGasConsumption(16, 20, 1.5)).toBeCloseTo(72)
  })
})

describe('tank gas', () => {
  it('stores cylinder volume × pressure liters', () => {
    expect(calculateGasVolume(AL80_VOLUME, 200)).toBeCloseTo(2220)
  })

  it('tank pressure decreases as gas is breathed', () => {
    const start = calculateGasVolume(AL80_VOLUME, 200)
    const afterTenMinutes = consumeGas(start, calculateGasConsumption(16, 20), 10)

    expect(afterTenMinutes).toBeCloseTo(start - 480)
    expect(calculateTankPressure(afterTenMinutes, AL80_VOLUME)).toBeLessThan(200)
    expect(calculateTankPressure(afterTenMinutes, AL80_VOLUME)).toBeCloseTo(156.8, 1)
  })

  it('never drops below 0 bar', () => {
    expect(consumeGas(10, 48, 5)).toBe(0)
    expect(calculateTankPressure(-5, AL80_VOLUME)).toBe(0)
  })

  it('lasts less time deeper', () => {
    const gas = calculateGasVolume(AL80_VOLUME, 150)
    expect(calculateGasDurationMinutes(gas, 16, 30)).toBeLessThan(
      calculateGasDurationMinutes(gas, 16, 10),
    )
  })
})
