import { METERS_PER_ATA, SURFACE_PRESSURE_ATA } from './constants'

/** Absolute ambient pressure (ATA) at a depth, using the 10 m ≈ 1 ATA rule. */
export function calculateAmbientPressure(depthMeters: number): number {
  return Math.max(0, depthMeters) / METERS_PER_ATA + SURFACE_PRESSURE_ATA
}

/** Depth (m) at which the ambient pressure equals `pressureAta`. */
export function calculateDepthForPressure(pressureAta: number): number {
  return Math.max(0, (pressureAta - SURFACE_PRESSURE_ATA) * METERS_PER_ATA)
}
