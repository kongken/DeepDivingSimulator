import type { SafetyStopState } from '@/types/dive'

import {
  DANGEROUS_ASCENT_RATE_MPM,
  LOW_GAS_PRESSURE_BAR,
  SAFE_ASCENT_RATE_MPM,
  SAFETY_STOP_DURATION_S,
  SAFETY_STOP_MAX_DEPTH_M,
  SAFETY_STOP_MIN_DEPTH_M,
  SAFETY_STOP_TRIGGER_DEPTH_M,
  TURN_PRESSURE_BAR,
} from './constants'

export type AscentLevel = 'normal' | 'fast' | 'dangerous'

/** Classifies an ascent rate in m/min (descending always counts as normal). */
export function classifyAscentRate(ascentRateMpm: number): AscentLevel {
  if (ascentRateMpm > DANGEROUS_ASCENT_RATE_MPM) return 'dangerous'
  if (ascentRateMpm > SAFE_ASCENT_RATE_MPM) return 'fast'
  return 'normal'
}

export type GasLevel = 'normal' | 'low' | 'turn' | 'reserve' | 'empty'

/** Gas alert for the current tank pressure. The reserve is the diver's own setting. */
export function getGasLevel(tankPressureBar: number, reservePressureBar: number): GasLevel {
  if (tankPressureBar <= 0) return 'empty'
  if (tankPressureBar <= reservePressureBar) return 'reserve'
  if (tankPressureBar <= TURN_PRESSURE_BAR) return 'turn'
  if (tankPressureBar <= LOW_GAS_PRESSURE_BAR) return 'low'
  return 'normal'
}

export function isSafetyStopRequired(maxDepthMeters: number): boolean {
  return maxDepthMeters >= SAFETY_STOP_TRIGGER_DEPTH_M
}

export function isInSafetyStopZone(depthMeters: number): boolean {
  return depthMeters >= SAFETY_STOP_MIN_DEPTH_M && depthMeters <= SAFETY_STOP_MAX_DEPTH_M
}

export function createSafetyStop(): SafetyStopState {
  return { required: false, remainingSeconds: SAFETY_STOP_DURATION_S, status: 'not-required' }
}

/**
 * Advances the safety stop countdown. The timer only runs inside the 4.5–5.5 m band
 * and pauses whenever the diver leaves it.
 */
export function updateSafetyStop(
  stop: SafetyStopState,
  depthMeters: number,
  maxDepthMeters: number,
  dt: number,
): SafetyStopState {
  if (stop.status === 'complete') return stop

  const required = isSafetyStopRequired(maxDepthMeters)
  if (!required) return { ...stop, required: false, status: 'not-required' }

  if (isInSafetyStopZone(depthMeters)) {
    const remainingSeconds = Math.max(0, stop.remainingSeconds - dt)
    return {
      required,
      remainingSeconds,
      status: remainingSeconds === 0 ? 'complete' : 'in-progress',
    }
  }

  const started = stop.remainingSeconds < SAFETY_STOP_DURATION_S
  return { ...stop, required, status: started ? 'paused' : 'pending' }
}
