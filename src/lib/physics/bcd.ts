import type { ControlInputs } from '@/types/dive'

import {
  BCD_DEFLATE_RATE_LPS,
  BCD_INFLATE_RATE_LPS,
  BCD_MAX_VOLUME_L,
  BUOYANCY_KG_PER_LITER,
} from './constants'
import { calculateAmbientPressure } from './pressure'

/** Boyle's law: P1 · V1 = P2 · V2. */
export function calculateBoyleVolume(
  volume1: number,
  pressure1: number,
  pressure2: number,
): number {
  return (volume1 * pressure1) / pressure2
}

/** Volume of a fixed amount of BCD gas after moving between two depths. */
export function calculateBcdVolumeAtDepth(
  volumeLiters: number,
  fromDepthMeters: number,
  toDepthMeters: number,
): number {
  return calculateBoyleVolume(
    volumeLiters,
    calculateAmbientPressure(fromDepthMeters),
    calculateAmbientPressure(toDepthMeters),
  )
}

export function calculateBcdBuoyancy(volumeLiters: number): number {
  return volumeLiters * BUOYANCY_KG_PER_LITER
}

export interface BcdVolumeLimit {
  volume: number
  /** True when gas above the bladder capacity escapes through the over-pressure valve. */
  vented: boolean
}

export function limitBcdVolume(volumeLiters: number): BcdVolumeLimit {
  if (volumeLiters > BCD_MAX_VOLUME_L) return { volume: BCD_MAX_VOLUME_L, vented: true }
  return { volume: Math.max(0, volumeLiters), vented: false }
}

export interface BcdControlResult {
  volume: number
  /** Surface-equivalent liters drawn from the tank to inflate. */
  gasDrawnLiters: number
}

/**
 * Applies the inflate / deflate buttons for `dt` seconds.
 * Inflating fills the bladder at ambient pressure, so it draws more tank gas when deep.
 */
export function applyBcdControls(
  volumeLiters: number,
  controls: Pick<ControlInputs, 'inflate' | 'deflate'>,
  depthMeters: number,
  gasAvailableLiters: number,
  dt: number,
): BcdControlResult {
  let volume = volumeLiters
  let gasDrawnLiters = 0

  if (controls.inflate && gasAvailableLiters > 0) {
    const pressure = calculateAmbientPressure(depthMeters)
    const room = Math.max(0, BCD_MAX_VOLUME_L - volume)
    const added = Math.min(BCD_INFLATE_RATE_LPS * dt, room, gasAvailableLiters / pressure)
    volume += added
    gasDrawnLiters = added * pressure
  }
  if (controls.deflate) {
    volume -= BCD_DEFLATE_RATE_LPS * dt
  }

  return { volume: Math.max(0, volume), gasDrawnLiters }
}
