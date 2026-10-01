import { DEFAULT_SUIT_COMPRESSION_FACTOR } from './constants'
import { calculateAmbientPressure } from './pressure'

/** Fraction (0–1] of surface buoyancy a neoprene suit keeps at depth. */
export function calculateSuitCompressionRatio(
  depthMeters: number,
  compressionFactor = DEFAULT_SUIT_COMPRESSION_FACTOR,
): number {
  return 1 / calculateAmbientPressure(depthMeters) ** compressionFactor
}

/** Wetsuit buoyancy (kg) at depth — neoprene bubbles compress as pressure rises. */
export function calculateWetsuitBuoyancy(
  surfaceBuoyancyKg: number,
  depthMeters: number,
  compressionFactor = DEFAULT_SUIT_COMPRESSION_FACTOR,
): number {
  return surfaceBuoyancyKg * calculateSuitCompressionRatio(depthMeters, compressionFactor)
}
