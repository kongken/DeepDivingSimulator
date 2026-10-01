import { describe, expect, it } from 'vitest'

import { getCylinder } from '@/data/cylinders'
import { getExposureSuit } from '@/data/exposure-suits'

import { updateLungVolume } from './breathing'
import {
  type BuoyancyInput,
  calculateBodyBuoyancy,
  calculateBuoyancyComponents,
  calculateLungBuoyancy,
  calculateNetBuoyancy,
  classifyBuoyancy,
} from './buoyancy'
import { MAX_LUNG_VOLUME_L, NEUTRAL_LUNG_VOLUME_L } from './constants'

const baseInput: BuoyancyInput = {
  depth: 20,
  waterType: 'salt',
  lungVolume: NEUTRAL_LUNG_VOLUME_L,
  bcdVolume: 0,
  suit: getExposureSuit('wetsuit-3mm'),
  cylinder: getCylinder('al80'),
  tankPressure: 200,
  weightKg: 4,
}

describe('lungs', () => {
  it('5 L => +1.5 kg, 2.5 L => −1 kg', () => {
    expect(calculateLungBuoyancy(5)).toBeCloseTo(1.5)
    expect(calculateLungBuoyancy(2.5)).toBeCloseTo(-1)
  })

  it('inhaling fills the lungs up to the limit', () => {
    const idle = { inhale: false, exhale: false }
    expect(updateLungVolume(3.5, { ...idle, inhale: true }, 1)).toBeGreaterThan(3.5)
    expect(updateLungVolume(5.4, { ...idle, inhale: true }, 5)).toBe(MAX_LUNG_VOLUME_L)
  })

  it('drifts back to normal breathing when released', () => {
    const released = updateLungVolume(5, { inhale: false, exhale: false }, 1)
    expect(released).toBeLessThan(5)
    expect(released).toBeGreaterThan(NEUTRAL_LUNG_VOLUME_L)
  })
})

describe('calculateNetBuoyancy', () => {
  it('sums every component', () => {
    const components = calculateBuoyancyComponents(baseInput)
    const sum = Object.values(components).reduce((total, value) => total + value, 0)
    expect(calculateNetBuoyancy(components)).toBeCloseTo(sum)
    expect(components.weights).toBe(-4)
  })

  it('salt water lifts more than fresh water', () => {
    expect(calculateBodyBuoyancy('salt')).toBeGreaterThan(calculateBodyBuoyancy('fresh'))
  })

  it('1 L of BCD air adds 1 kg of lift', () => {
    const empty = calculateNetBuoyancy(calculateBuoyancyComponents(baseInput))
    const oneLiter = calculateNetBuoyancy(
      calculateBuoyancyComponents({ ...baseInput, bcdVolume: 1 }),
    )
    expect(oneLiter - empty).toBeCloseTo(1)
  })

  it('a lighter tank makes the diver more buoyant', () => {
    const full = calculateNetBuoyancy(calculateBuoyancyComponents(baseInput))
    const reserve = calculateNetBuoyancy(
      calculateBuoyancyComponents({ ...baseInput, tankPressure: 50 }),
    )
    expect(reserve).toBeGreaterThan(full)
  })

  it('the same diver is less buoyant deeper (suit compression)', () => {
    const shallow = calculateNetBuoyancy(calculateBuoyancyComponents({ ...baseInput, depth: 5 }))
    const deep = calculateNetBuoyancy(calculateBuoyancyComponents({ ...baseInput, depth: 30 }))
    expect(deep).toBeLessThan(shallow)
  })

  it('classifies small values as neutral', () => {
    expect(classifyBuoyancy(0.1)).toBe('neutral')
    expect(classifyBuoyancy(1.2)).toBe('positive')
    expect(classifyBuoyancy(-0.8)).toBe('negative')
  })
})
