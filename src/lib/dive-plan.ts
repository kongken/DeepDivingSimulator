import { DEFAULT_CYLINDER_ID, getCylinder } from '@/data/cylinders'
import { DEFAULT_DIVE_SITE_ID, getDiveSite } from '@/data/dive-sites'
import { DEFAULT_SUIT_ID, getExposureSuit } from '@/data/exposure-suits'
import { formatNumber } from '@/lib/format'
import { calculateBuoyancyComponents, calculateNetBuoyancy } from '@/lib/physics/buoyancy'
import {
  BCD_MAX_VOLUME_L,
  NEUTRAL_LUNG_VOLUME_L,
  SAFE_ASCENT_RATE_MPM,
  SAFETY_STOP_DEPTH_M,
  SAFETY_STOP_DURATION_S,
  SECONDS_PER_MINUTE,
} from '@/lib/physics/constants'
import { calculateGasConsumption, calculateGasVolume } from '@/lib/physics/gas'
import { isSafetyStopRequired } from '@/lib/physics/safety'
import { calculateNeutralBcdVolume, calculateSurfaceFloatBcdVolume } from '@/lib/physics/simulation'
import type { Cylinder, DivePlan, DiveSetup } from '@/types/dive'

export const DEFAULT_PLAN: DivePlan = {
  siteId: DEFAULT_DIVE_SITE_ID,
  maxDepth: 20,
  bottomTime: 30,
  startPressure: 200,
  reservePressure: 50,
  sacRate: 16,
  cylinderId: DEFAULT_CYLINDER_ID,
  suitId: DEFAULT_SUIT_ID,
  weightKg: 4,
}

export const PLAN_LIMITS = {
  maxDepth: { min: 3, step: 1 },
  bottomTime: { min: 5, max: 90, step: 1 },
  startPressure: { min: 100, step: 5 },
  reservePressure: { min: 30, max: 100, step: 5 },
  sacRate: { min: 8, max: 30, step: 1 },
  weightKg: { min: 0, max: 12, step: 0.5 },
} as const

/** Planned depths beyond this need deep-diver training. */
export const DEEP_DIVE_DEPTH_M = 30
/** Selected weight may exceed the recommendation by this much before it counts as overweighted. */
export const OVERWEIGHT_TOLERANCE_KG = 1
/** Selected weight may fall short of the recommendation by this much. */
export const UNDERWEIGHT_TOLERANCE_KG = 0.5
const WEIGHT_ROUNDING_KG = PLAN_LIMITS.weightKg.step

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function resolveDiveSetup(plan: DivePlan): DiveSetup {
  return {
    plan,
    site: getDiveSite(plan.siteId),
    cylinder: getCylinder(plan.cylinderId),
    suit: getExposureSuit(plan.suitId),
  }
}

/** Keeps a plan within what the chosen site and cylinder allow. */
export function normalizePlan(plan: DivePlan): DivePlan {
  const site = getDiveSite(plan.siteId)
  const cylinder = getCylinder(plan.cylinderId)
  const maxDepthLimit = Math.max(PLAN_LIMITS.maxDepth.min, site.maxDepth)

  return {
    ...plan,
    siteId: site.id,
    cylinderId: cylinder.id,
    suitId: getExposureSuit(plan.suitId).id,
    maxDepth: clamp(plan.maxDepth, PLAN_LIMITS.maxDepth.min, maxDepthLimit),
    bottomTime: clamp(plan.bottomTime, PLAN_LIMITS.bottomTime.min, PLAN_LIMITS.bottomTime.max),
    startPressure: clamp(
      plan.startPressure,
      PLAN_LIMITS.startPressure.min,
      cylinder.workingPressure,
    ),
    reservePressure: clamp(
      plan.reservePressure,
      PLAN_LIMITS.reservePressure.min,
      PLAN_LIMITS.reservePressure.max,
    ),
    sacRate: clamp(plan.sacRate, PLAN_LIMITS.sacRate.min, PLAN_LIMITS.sacRate.max),
    weightKg: clamp(plan.weightKg, PLAN_LIMITS.weightKg.min, PLAN_LIMITS.weightKg.max),
  }
}

export interface GasPlan {
  totalGasLiters: number
  reserveGasLiters: number
  usableGasLiters: number
  consumptionAtDepthLpm: number
  bottomGasLiters: number
  /** Gas for a 9 m/min ascent plus the safety stop. */
  ascentGasLiters: number
  requiredGasLiters: number
  predictedEndPressure: number
  /** Longest bottom time at max depth that still surfaces with the reserve. */
  maxBottomTimeMinutes: number
  sufficient: boolean
}

/** Simple square-profile gas plan: the whole bottom time is spent at max depth. */
export function calculateGasPlan(plan: DivePlan, cylinder: Pick<Cylinder, 'waterVolume'>): GasPlan {
  const totalGasLiters = calculateGasVolume(cylinder.waterVolume, plan.startPressure)
  const reserveGasLiters = calculateGasVolume(cylinder.waterVolume, plan.reservePressure)
  const usableGasLiters = Math.max(0, totalGasLiters - reserveGasLiters)
  const consumptionAtDepthLpm = calculateGasConsumption(plan.sacRate, plan.maxDepth)

  const ascentMinutes = plan.maxDepth / SAFE_ASCENT_RATE_MPM
  const ascentGas = calculateGasConsumption(plan.sacRate, plan.maxDepth / 2) * ascentMinutes
  const stopGas = isSafetyStopRequired(plan.maxDepth)
    ? calculateGasConsumption(plan.sacRate, SAFETY_STOP_DEPTH_M) *
      (SAFETY_STOP_DURATION_S / SECONDS_PER_MINUTE)
    : 0
  const ascentGasLiters = ascentGas + stopGas
  const bottomGasLiters = consumptionAtDepthLpm * plan.bottomTime
  const requiredGasLiters = bottomGasLiters + ascentGasLiters
  const predictedEndPressure = (totalGasLiters - requiredGasLiters) / cylinder.waterVolume

  return {
    totalGasLiters,
    reserveGasLiters,
    usableGasLiters,
    consumptionAtDepthLpm,
    bottomGasLiters,
    ascentGasLiters,
    requiredGasLiters,
    predictedEndPressure,
    maxBottomTimeMinutes: Math.max(0, (usableGasLiters - ascentGasLiters) / consumptionAtDepthLpm),
    sufficient: predictedEndPressure >= plan.reservePressure,
  }
}

export type WeightStatus = 'under' | 'ok' | 'over'

export interface WeightCheck {
  recommendedKg: number
  /** Selected minus recommended weight, kg. */
  differenceKg: number
  status: WeightStatus
}

/**
 * Classic weight check: neutral at the safety stop with the reserve left in the tank,
 * an empty BCD and normal breathing.
 */
export function calculateWeightCheck(setup: DiveSetup): WeightCheck {
  const liftWithoutWeights = calculateNetBuoyancy(
    calculateBuoyancyComponents({
      depth: SAFETY_STOP_DEPTH_M,
      waterType: setup.site.waterType,
      lungVolume: NEUTRAL_LUNG_VOLUME_L,
      bcdVolume: 0,
      suit: setup.suit,
      cylinder: setup.cylinder,
      tankPressure: setup.plan.reservePressure,
      weightKg: 0,
    }),
  )
  const recommendedKg = Math.max(
    0,
    Math.ceil(liftWithoutWeights / WEIGHT_ROUNDING_KG) * WEIGHT_ROUNDING_KG,
  )
  const differenceKg = setup.plan.weightKg - recommendedKg
  const status: WeightStatus =
    differenceKg > OVERWEIGHT_TOLERANCE_KG
      ? 'over'
      : differenceKg < -UNDERWEIGHT_TOLERANCE_KG
        ? 'under'
        : 'ok'

  return { recommendedKg, differenceKg, status }
}

export type PlanIssueLevel = 'error' | 'warning' | 'info'

export interface PlanIssue {
  id: 'reserve' | 'gas' | 'weight' | 'deep'
  level: PlanIssueLevel
  message: string
}

export function getPlanIssues(setup: DiveSetup): PlanIssue[] {
  const { plan, cylinder } = setup
  const issues: PlanIssue[] = []

  if (plan.reservePressure >= plan.startPressure) {
    issues.push({
      id: 'reserve',
      level: 'error',
      message: 'Reserve pressure must be lower than the starting pressure.',
    })
  }

  const gasPlan = calculateGasPlan(plan, cylinder)
  if (!gasPlan.sufficient) {
    issues.push({
      id: 'gas',
      level: 'warning',
      message: `This plan surfaces with about ${Math.max(0, Math.round(gasPlan.predictedEndPressure))} bar — below your ${plan.reservePressure} bar reserve. Keep the bottom time under ${Math.floor(gasPlan.maxBottomTimeMinutes)} min or plan shallower.`,
    })
  }

  const weight = calculateWeightCheck(setup)
  if (weight.status !== 'ok') {
    issues.push({
      id: 'weight',
      level: 'warning',
      message:
        weight.status === 'over'
          ? `Overweighted by about ${weight.differenceKg.toFixed(1)} kg — you will need extra BCD air at depth.`
          : `Underweighted by about ${Math.abs(weight.differenceKg).toFixed(1)} kg — holding the safety stop with a light tank will be hard.`,
    })
  }

  if (plan.maxDepth > DEEP_DIVE_DEPTH_M) {
    issues.push({
      id: 'deep',
      level: 'info',
      message: `Planned depth beyond ${DEEP_DIVE_DEPTH_M} m — deep dive training recommended.`,
    })
  }

  return issues
}

export function canStartDive(issues: readonly PlanIssue[]): boolean {
  return issues.every((issue) => issue.level !== 'error')
}

export type PreDiveCheckStatus = 'ok' | 'warning'

export interface PreDiveCheck {
  id: 'bcd' | 'weights' | 'releases' | 'air' | 'final'
  label: string
  detail: string
  status: PreDiveCheckStatus
}

/** The classic BWRAF buddy check, filled in from the plan. */
export function getPreDiveChecks(setup: DiveSetup): PreDiveCheck[] {
  const { plan, site, cylinder, suit } = setup
  const gasPlan = calculateGasPlan(plan, cylinder)
  const weight = calculateWeightCheck(setup)
  const floats = calculateNeutralBcdVolume(setup, 0, plan.startPressure) < BCD_MAX_VOLUME_L

  return [
    {
      id: 'bcd',
      label: 'BCD',
      detail: floats
        ? `Inflates and deflates. Starts with ${formatNumber(calculateSurfaceFloatBcdVolume(setup))} L so you float at the surface.`
        : 'Even a full BCD cannot keep you afloat — remove some weight.',
      status: floats ? 'ok' : 'warning',
    },
    {
      id: 'weights',
      label: 'Weights',
      detail: `${formatNumber(plan.weightKg)} kg on the belt — recommended ${formatNumber(weight.recommendedKg)} kg.`,
      status: weight.status === 'ok' ? 'ok' : 'warning',
    },
    {
      id: 'releases',
      label: 'Releases',
      detail: 'Buckles, weight pockets and tank band secured.',
      status: 'ok',
    },
    {
      id: 'air',
      label: 'Air',
      detail: `${plan.startPressure} bar in a ${cylinder.name} — ${Math.round(gasPlan.totalGasLiters)} L. Plan surfaces with ≈ ${Math.max(0, Math.round(gasPlan.predictedEndPressure))} bar.`,
      status: gasPlan.sufficient ? 'ok' : 'warning',
    },
    {
      id: 'final',
      label: 'Final OK',
      detail: `${site.name} · ${plan.maxDepth} m · ${plan.bottomTime} min · ${suit.name}.`,
      status: 'ok',
    },
  ]
}
