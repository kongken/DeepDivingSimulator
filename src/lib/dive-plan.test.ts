import { describe, expect, it } from 'vitest'

import {
  DEFAULT_PLAN,
  calculateGasPlan,
  calculateWeightCheck,
  canStartDive,
  getPlanIssues,
  normalizePlan,
  resolveDiveSetup,
} from './dive-plan'

describe('calculateGasPlan', () => {
  const setup = resolveDiveSetup(DEFAULT_PLAN)
  const gasPlan = calculateGasPlan(DEFAULT_PLAN, setup.cylinder)

  it('AL80 at 200 bar holds 2220 L', () => {
    expect(gasPlan.totalGasLiters).toBeCloseTo(2220)
    expect(gasPlan.reserveGasLiters).toBeCloseTo(555)
  })

  it('breathes 48 L/min at the planned 20 m', () => {
    expect(gasPlan.consumptionAtDepthLpm).toBeCloseTo(48)
  })

  it('the default plan surfaces above the reserve', () => {
    expect(gasPlan.sufficient).toBe(true)
    expect(gasPlan.predictedEndPressure).toBeGreaterThan(DEFAULT_PLAN.reservePressure)
    expect(gasPlan.maxBottomTimeMinutes).toBeGreaterThan(DEFAULT_PLAN.bottomTime)
  })

  it('a long deep dive runs into the reserve', () => {
    const deepPlan = { ...DEFAULT_PLAN, maxDepth: 35, bottomTime: 40 }
    expect(calculateGasPlan(deepPlan, setup.cylinder).sufficient).toBe(false)
    expect(getPlanIssues(resolveDiveSetup(deepPlan)).map((issue) => issue.id)).toContain('gas')
  })
})

describe('calculateWeightCheck', () => {
  it('the default 4 kg suits a 3 mm wetsuit and AL80 in salt water', () => {
    const check = calculateWeightCheck(resolveDiveSetup(DEFAULT_PLAN))
    expect(check.status).toBe('ok')
    expect(check.recommendedKg).toBeGreaterThanOrEqual(3)
    expect(check.recommendedKg).toBeLessThanOrEqual(5)
  })

  it('needs less lead in fresh water', () => {
    const salt = calculateWeightCheck(resolveDiveSetup(DEFAULT_PLAN))
    const fresh = calculateWeightCheck(
      resolveDiveSetup({ ...DEFAULT_PLAN, siteId: 'training-pool', maxDepth: 5 }),
    )
    expect(fresh.recommendedKg).toBeLessThan(salt.recommendedKg)
  })

  it('flags 12 kg as overweighted', () => {
    expect(calculateWeightCheck(resolveDiveSetup({ ...DEFAULT_PLAN, weightKg: 12 })).status).toBe(
      'over',
    )
  })
})

describe('normalizePlan', () => {
  it('limits the planned depth to the site', () => {
    expect(normalizePlan({ ...DEFAULT_PLAN, siteId: 'training-pool' }).maxDepth).toBe(5)
  })

  it('limits the starting pressure to the cylinder rating', () => {
    expect(normalizePlan({ ...DEFAULT_PLAN, startPressure: 230 }).startPressure).toBe(207)
    expect(
      normalizePlan({ ...DEFAULT_PLAN, cylinderId: 'steel-12', startPressure: 230 }).startPressure,
    ).toBe(230)
  })

  it('falls back to known equipment ids', () => {
    expect(normalizePlan({ ...DEFAULT_PLAN, cylinderId: 'unknown' }).cylinderId).toBe('al80')
  })
})

describe('getPlanIssues', () => {
  it('blocks a reserve above the starting pressure', () => {
    const issues = getPlanIssues(
      resolveDiveSetup({ ...DEFAULT_PLAN, startPressure: 100, reservePressure: 100 }),
    )
    expect(canStartDive(issues)).toBe(false)
  })

  it('the default plan has no issues', () => {
    expect(getPlanIssues(resolveDiveSetup(DEFAULT_PLAN))).toEqual([])
  })
})
