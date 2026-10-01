import type { BuoyancyComponents, Cylinder, ExposureSuit, WaterType } from '@/types/dive'

import { calculateBcdBuoyancy } from './bcd'
import {
  BODY_MASS_KG,
  BODY_VOLUME_L,
  BUOYANCY_KG_PER_LITER,
  BUOYANCY_TREND_THRESHOLD_KG_PER_MIN,
  NEUTRAL_BUOYANCY_TOLERANCE_KG,
  NEUTRAL_LUNG_VOLUME_L,
  WATER_DENSITY_KG_PER_L,
} from './constants'
import { calculateTankBuoyancy } from './tank'
import { calculateWetsuitBuoyancy } from './wetsuit'

/** Buoyancy of the diver's body with lungs at neutral volume — salt water lifts more. */
export function calculateBodyBuoyancy(waterType: WaterType): number {
  return BODY_VOLUME_L * WATER_DENSITY_KG_PER_L[waterType] - BODY_MASS_KG
}

/** Extra lift from lungs above (or below) the neutral breathing volume. */
export function calculateLungBuoyancy(
  lungVolumeLiters: number,
  neutralLungVolumeLiters = NEUTRAL_LUNG_VOLUME_L,
): number {
  return (lungVolumeLiters - neutralLungVolumeLiters) * BUOYANCY_KG_PER_LITER
}

export interface BuoyancyInput {
  depth: number
  waterType: WaterType
  lungVolume: number
  bcdVolume: number
  suit: Pick<ExposureSuit, 'surfaceBuoyancyKg' | 'compressionFactor'>
  cylinder: Pick<Cylinder, 'waterVolume' | 'emptyBuoyancyKg'>
  tankPressure: number
  weightKg: number
}

export function calculateBuoyancyComponents(input: BuoyancyInput): BuoyancyComponents {
  const tank = calculateTankBuoyancy(input.cylinder, input.tankPressure)
  return {
    body: calculateBodyBuoyancy(input.waterType),
    lungs: calculateLungBuoyancy(input.lungVolume),
    bcd: calculateBcdBuoyancy(input.bcdVolume),
    wetsuit: calculateWetsuitBuoyancy(
      input.suit.surfaceBuoyancyKg,
      input.depth,
      input.suit.compressionFactor,
    ),
    cylinder: tank.cylinder,
    gas: tank.gas,
    weights: -input.weightKg,
  }
}

/** Sum of all signed buoyancy contributions, kg (+ rises, − sinks). */
export function calculateNetBuoyancy(components: BuoyancyComponents): number {
  return (
    components.body +
    components.lungs +
    components.bcd +
    components.wetsuit +
    components.cylinder +
    components.gas +
    components.weights
  )
}

export type BuoyancyState = 'positive' | 'neutral' | 'negative'

export function classifyBuoyancy(netBuoyancyKg: number): BuoyancyState {
  if (netBuoyancyKg > NEUTRAL_BUOYANCY_TOLERANCE_KG) return 'positive'
  if (netBuoyancyKg < -NEUTRAL_BUOYANCY_TOLERANCE_KG) return 'negative'
  return 'neutral'
}

export type BuoyancyTrend = 'increasing' | 'steady' | 'decreasing'

export function classifyBuoyancyTrend(trendKgPerMinute: number): BuoyancyTrend {
  if (trendKgPerMinute > BUOYANCY_TREND_THRESHOLD_KG_PER_MIN) return 'increasing'
  if (trendKgPerMinute < -BUOYANCY_TREND_THRESHOLD_KG_PER_MIN) return 'decreasing'
  return 'steady'
}
