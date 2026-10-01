import { describe, expect, it } from 'vitest'

import { SAFETY_STOP_DURATION_S } from './constants'
import { classifyAscentRate, createSafetyStop, getGasLevel, updateSafetyStop } from './safety'

describe('classifyAscentRate', () => {
  it.each([
    [-15, 'normal'],
    [6.2, 'normal'],
    [9, 'normal'],
    [9.5, 'fast'],
    [12, 'fast'],
    [12.5, 'dangerous'],
  ] as const)('%d m/min is %s', (rate, level) => {
    expect(classifyAscentRate(rate)).toBe(level)
  })
})

describe('getGasLevel', () => {
  it.each([
    [150, 'normal'],
    [100, 'low'],
    [70, 'turn'],
    [50, 'reserve'],
    [0, 'empty'],
  ] as const)('%d bar is %s', (pressure, level) => {
    expect(getGasLevel(pressure, 50)).toBe(level)
  })

  it('uses the diver’s own reserve setting', () => {
    expect(getGasLevel(80, 80)).toBe('reserve')
  })
})

describe('updateSafetyStop', () => {
  it('is not required for shallow dives', () => {
    expect(updateSafetyStop(createSafetyStop(), 5, 8, 1).status).toBe('not-required')
  })

  it('counts down only inside the 4.5–5.5 m band', () => {
    let stop = updateSafetyStop(createSafetyStop(), 12, 20, 1)
    expect(stop).toMatchObject({ status: 'pending', remainingSeconds: SAFETY_STOP_DURATION_S })

    stop = updateSafetyStop(stop, 5, 20, 10)
    expect(stop).toMatchObject({ status: 'in-progress', remainingSeconds: 170 })

    stop = updateSafetyStop(stop, 3.9, 20, 10)
    expect(stop).toMatchObject({ status: 'paused', remainingSeconds: 170 })

    stop = updateSafetyStop(stop, 5.4, 20, 170)
    expect(stop).toMatchObject({ status: 'complete', remainingSeconds: 0 })
  })

  it('stays complete once done', () => {
    const done = updateSafetyStop(createSafetyStop(), 5, 20, SAFETY_STOP_DURATION_S)
    expect(updateSafetyStop(done, 15, 20, 1).status).toBe('complete')
  })
})
