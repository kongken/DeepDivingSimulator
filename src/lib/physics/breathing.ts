import type { ControlInputs } from '@/types/dive'

import {
  BREATH_CYCLE_SECONDS,
  LUNG_EMPTY_RATE_LPS,
  LUNG_FILL_RATE_LPS,
  LUNG_RECOVERY_RATE_LPS,
  MAX_LUNG_VOLUME_L,
  MIN_LUNG_VOLUME_L,
  NEUTRAL_LUNG_VOLUME_L,
  TIDAL_VOLUME_AMPLITUDE_L,
} from './constants'

const FULL_CYCLE_RADIANS = Math.PI * 2

function clampLungVolume(volume: number): number {
  return Math.min(MAX_LUNG_VOLUME_L, Math.max(MIN_LUNG_VOLUME_L, volume))
}

/**
 * Inhale fills the lungs, exhale empties them. With neither pressed the diver
 * drifts back to a normal breathing volume so a big breath only gives a temporary lift.
 */
export function updateLungVolume(
  volumeLiters: number,
  controls: Pick<ControlInputs, 'inhale' | 'exhale'>,
  dt: number,
): number {
  if (controls.inhale && !controls.exhale) {
    return clampLungVolume(volumeLiters + LUNG_FILL_RATE_LPS * dt)
  }
  if (controls.exhale && !controls.inhale) {
    return clampLungVolume(volumeLiters - LUNG_EMPTY_RATE_LPS * dt)
  }

  const offset = NEUTRAL_LUNG_VOLUME_L - volumeLiters
  const step = Math.min(Math.abs(offset), LUNG_RECOVERY_RATE_LPS * dt)
  return clampLungVolume(volumeLiters + Math.sign(offset) * step)
}

export function advanceBreathPhase(phaseRadians: number, dt: number): number {
  return (phaseRadians + (FULL_CYCLE_RADIANS * dt) / BREATH_CYCLE_SECONDS) % FULL_CYCLE_RADIANS
}

/** Lung volume added by the automatic breathing cycle (positive while inhaling). */
export function calculateTidalOffset(phaseRadians: number): number {
  return Math.sin(phaseRadians) * TIDAL_VOLUME_AMPLITUDE_L
}

/** True during the exhale half of the breathing cycle — when bubbles leave the regulator. */
export function isExhaling(phaseRadians: number): boolean {
  return Math.cos(phaseRadians) < 0
}
