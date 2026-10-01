import { describe, expect, it } from 'vitest'

import { getCylinder } from '@/data/cylinders'

import { calculateTankBuoyancy, calculateTankGasMass } from './tank'

describe('calculateTankGasMass', () => {
  it('a full AL80 holds about 2.7 kg of air', () => {
    expect(calculateTankGasMass(11.1, 200)).toBeCloseTo(2.72, 2)
  })

  it('the tank gets lighter from 200 → 50 bar', () => {
    const masses = [200, 150, 100, 50].map((pressure) => calculateTankGasMass(11.1, pressure))
    for (let index = 1; index < masses.length; index += 1) {
      expect(masses[index]).toBeLessThan(masses[index - 1])
    }
    expect(masses[0] - masses[3]).toBeCloseTo(2.04, 2)
  })
})

describe('calculateTankBuoyancy', () => {
  it('becomes more buoyant as the tank empties', () => {
    const cylinder = getCylinder('al80')
    const full = calculateTankBuoyancy(cylinder, 200)
    const reserve = calculateTankBuoyancy(cylinder, 50)

    expect(full.total).toBeLessThan(0)
    expect(reserve.total).toBeGreaterThan(full.total)
    expect(reserve.cylinder).toBe(full.cylinder)
  })

  it('steel tanks stay negative even when empty', () => {
    expect(calculateTankBuoyancy(getCylinder('steel-15'), 0).total).toBeLessThan(0)
  })
})
