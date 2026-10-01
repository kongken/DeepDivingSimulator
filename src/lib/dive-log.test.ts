import { describe, expect, it } from 'vitest'

import {
  assessAscentControl,
  assessBuoyancyControl,
  assessGasManagement,
  createDiveLog,
  downsampleProfile,
} from './dive-log'
import { DEFAULT_PLAN, resolveDiveSetup } from './dive-plan'
import { createInitialSimulation } from './physics/simulation'

describe('assessments', () => {
  it('rates a clean dive as good', () => {
    expect(
      assessBuoyancyControl({
        maxDepth: 20.4,
        plannedMaxDepth: 20,
        maxAscentRate: 8,
        depthReversals: 1,
        seabedContacts: 0,
      }).rating,
    ).toBe('good')
    expect(
      assessAscentControl({
        maxAscentRate: 8,
        secondsOverSafeAscent: 0,
        secondsOverDangerousAscent: 0,
        safetyStop: 'complete',
      }).rating,
    ).toBe('good')
    expect(
      assessGasManagement({ endPressure: 70, reservePressure: 50, outOfGas: false }).rating,
    ).toBe('good')
  })

  it('flags runaway ascents and big depth overshoots as unsafe', () => {
    const assessment = assessBuoyancyControl({
      maxDepth: 25,
      plannedMaxDepth: 20,
      maxAscentRate: 22,
      depthReversals: 1,
      seabedContacts: 0,
    })
    expect(assessment.rating).toBe('unsafe')
    expect(assessment.notes).toHaveLength(2)
  })

  it('a skipped safety stop needs improvement', () => {
    expect(
      assessAscentControl({
        maxAscentRate: 8,
        secondsOverSafeAscent: 0,
        secondsOverDangerousAscent: 0,
        safetyStop: 'incomplete',
      }).rating,
    ).toBe('needs-improvement')
  })

  it('sustained ascents over 12 m/min are unsafe', () => {
    expect(
      assessAscentControl({
        maxAscentRate: 15,
        secondsOverSafeAscent: 12,
        secondsOverDangerousAscent: 6,
        safetyStop: 'complete',
      }).rating,
    ).toBe('unsafe')
  })

  it('grades gas by the reserve', () => {
    expect(
      assessGasManagement({ endPressure: 40, reservePressure: 50, outOfGas: false }).rating,
    ).toBe('needs-improvement')
    expect(
      assessGasManagement({ endPressure: 0, reservePressure: 50, outOfGas: true }).rating,
    ).toBe('unsafe')
  })
})

describe('downsampleProfile', () => {
  it('keeps the first and last sample', () => {
    const samples = Array.from({ length: 1000 }, (_, time) => ({
      time,
      depth: time / 50,
      tankPressure: 200,
      netBuoyancyKg: 0,
      ascentRate: 0,
    }))
    const reduced = downsampleProfile(samples, 100)
    expect(reduced).toHaveLength(100)
    expect(reduced[0]).toBe(samples[0])
    expect(reduced.at(-1)).toBe(samples.at(-1))
  })
})

describe('createDiveLog', () => {
  it('summarises the dive', () => {
    const setup = resolveDiveSetup(DEFAULT_PLAN)
    const state = {
      ...createInitialSimulation(setup),
      hasDescended: true,
      maxDepth: 18,
      diveTimeSeconds: 600,
      gasRemainingLiters: setup.cylinder.waterVolume * 150,
      tankPressure: 150,
      stats: {
        ...createInitialSimulation(setup).stats,
        depthTimeIntegral: 600 * 12,
        pressureTimeIntegral: 10 * 2.2,
        bcdGasLiters: 55,
      },
    }
    const log = createDiveLog(state, setup, { id: 'test', endedAt: '2026-10-01T00:00:00.000Z' })

    expect(log.gasUsedLiters).toBeCloseTo(555)
    expect(log.averageDepth).toBeCloseTo(12)
    expect(log.bcdGasLiters).toBe(55)
    // BCD inflation gas is not breathing gas, so it is left out of the SAC.
    expect(log.averageSac).toBeCloseTo(500 / 22)
    expect(log.safetyStop).toBe('not-required')
    expect(log.siteName).toBe('Racha Yai')
  })
})
