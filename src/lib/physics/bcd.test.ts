import { describe, expect, it } from 'vitest'

import {
  applyBcdControls,
  calculateBcdVolumeAtDepth,
  calculateBoyleVolume,
  limitBcdVolume,
} from './bcd'
import { BCD_MAX_VOLUME_L } from './constants'

describe("Boyle's law", () => {
  it('BCD volume increases when pressure decreases', () => {
    expect(calculateBoyleVolume(2, 4, 2)).toBeCloseTo(4)
    expect(calculateBcdVolumeAtDepth(3, 20, 10)).toBeGreaterThan(3)
  })

  it('2 L at 30 m expands to 8 L at the surface', () => {
    expect(calculateBcdVolumeAtDepth(2, 30, 0)).toBeCloseTo(8)
  })

  it('BCD volume shrinks on the way down', () => {
    expect(calculateBcdVolumeAtDepth(4, 0, 10)).toBeCloseTo(2)
  })
})

describe('limitBcdVolume', () => {
  it('vents gas above the bladder capacity', () => {
    expect(limitBcdVolume(14)).toEqual({ volume: BCD_MAX_VOLUME_L, vented: true })
    expect(limitBcdVolume(6)).toEqual({ volume: 6, vented: false })
  })
})

describe('applyBcdControls', () => {
  const idle = { inflate: false, deflate: false }

  it('inflates at 1 L/s and draws tank gas at ambient pressure', () => {
    const result = applyBcdControls(0, { ...idle, inflate: true }, 20, 2000, 1)
    expect(result.volume).toBeCloseTo(1)
    expect(result.gasDrawnLiters).toBeCloseTo(3)
  })

  it('deflates at 1.5 L/s and never below empty', () => {
    expect(applyBcdControls(3, { ...idle, deflate: true }, 10, 2000, 1).volume).toBeCloseTo(1.5)
    expect(applyBcdControls(1, { ...idle, deflate: true }, 10, 2000, 1).volume).toBe(0)
  })

  it('cannot inflate from an empty tank', () => {
    expect(applyBcdControls(2, { ...idle, inflate: true }, 10, 0, 1).volume).toBe(2)
  })
})
