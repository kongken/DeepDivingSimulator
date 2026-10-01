import {
  DANGEROUS_ASCENT_RATE_MPM,
  LOW_GAS_PRESSURE_BAR,
  SAFE_ASCENT_RATE_MPM,
  SECONDS_PER_MINUTE,
  SURFACE_DEPTH_M,
  TURN_PRESSURE_BAR,
} from '@/lib/physics/constants'
import { classifyBuoyancy } from '@/lib/physics/buoyancy'
import { classifyAscentRate, getGasLevel, isInSafetyStopZone } from '@/lib/physics/safety'
import { canEndDive } from '@/lib/physics/simulation'
import type { DiveSetup, SimulationState } from '@/types/dive'

/** How far past the planned max depth the diver may drift before an alert. */
export const PLAN_DEPTH_TOLERANCE_M = 0.5

export type AlertTone = 'info' | 'caution' | 'warning' | 'danger'

const TONE_PRIORITY: Record<AlertTone, number> = { info: 0, caution: 1, warning: 2, danger: 3 }

export type DiveAlertId =
  | 'out-of-gas'
  | 'dangerous-ascent'
  | 'fast-ascent'
  | 'reserve'
  | 'turn'
  | 'low-gas'
  | 'below-plan'
  | 'time-exceeded'
  | 'seabed'
  | 'bcd-venting'

export interface DiveAlert {
  id: DiveAlertId
  tone: AlertTone
  title: string
  message: string
}

/** All active alerts, most severe first. */
export function getDiveAlerts(state: SimulationState, setup: DiveSetup): DiveAlert[] {
  const { plan } = setup
  const gas = getGasLevel(state.tankPressure, plan.reservePressure)
  const ascent = classifyAscentRate(state.ascentRate)
  const alerts: DiveAlert[] = []

  if (gas === 'empty') {
    alerts.push({
      id: 'out-of-gas',
      tone: 'danger',
      title: 'OUT OF GAS',
      message: 'Tank empty. Make a controlled emergency ascent and exhale all the way up.',
    })
  }
  if (ascent === 'dangerous') {
    alerts.push({
      id: 'dangerous-ascent',
      tone: 'danger',
      title: 'DANGEROUS ASCENT',
      message: `Over ${DANGEROUS_ASCENT_RATE_MPM} m/min. Dump BCD air and exhale now.`,
    })
  } else if (ascent === 'fast') {
    alerts.push({
      id: 'fast-ascent',
      tone: 'warning',
      title: 'ASCENT TOO FAST',
      message: `Over ${SAFE_ASCENT_RATE_MPM} m/min. Vent the BCD to slow down.`,
    })
  }
  if (gas === 'reserve') {
    alerts.push({
      id: 'reserve',
      tone: 'warning',
      title: 'RESERVE GAS',
      message: `At your ${plan.reservePressure} bar reserve. Begin your ascent now.`,
    })
  } else if (gas === 'turn') {
    alerts.push({
      id: 'turn',
      tone: 'caution',
      title: 'TURN PRESSURE',
      message: `${TURN_PRESSURE_BAR} bar — prepare to ascend.`,
    })
  } else if (gas === 'low') {
    alerts.push({
      id: 'low-gas',
      tone: 'caution',
      title: 'LOW GAS',
      message: `Below ${LOW_GAS_PRESSURE_BAR} bar. Keep an eye on your gauge.`,
    })
  }
  if (state.depth > plan.maxDepth + PLAN_DEPTH_TOLERANCE_M) {
    alerts.push({
      id: 'below-plan',
      tone: 'caution',
      title: 'DEEPER THAN PLAN',
      message: `You are below your planned ${plan.maxDepth} m. Add a little air to level off.`,
    })
  }
  if (
    state.diveTimeSeconds > plan.bottomTime * SECONDS_PER_MINUTE &&
    state.depth > SURFACE_DEPTH_M
  ) {
    alerts.push({
      id: 'time-exceeded',
      tone: 'caution',
      title: 'PLANNED TIME REACHED',
      message: `${plan.bottomTime} min planned. Start a slow ascent.`,
    })
  }
  if (state.onSeabed) {
    alerts.push({
      id: 'seabed',
      tone: 'info',
      title: 'ON THE BOTTOM',
      message: 'Add a little BCD air to lift off without stirring up the sand.',
    })
  }
  if (state.bcdVenting) {
    alerts.push({
      id: 'bcd-venting',
      tone: 'info',
      title: 'BCD VENTING',
      message: 'The over-pressure valve is releasing expanding air.',
    })
  }

  return alerts.sort((a, b) => TONE_PRIORITY[b.tone] - TONE_PRIORITY[a.tone])
}

export type ComputerStatusTone = AlertTone | 'ok'

export interface ComputerStatus {
  label: string
  tone: ComputerStatusTone
}

/** The single headline status shown on the dive computer. */
export function getComputerStatus(state: SimulationState, setup: DiveSetup): ComputerStatus {
  const gas = getGasLevel(state.tankPressure, setup.plan.reservePressure)
  const ascent = classifyAscentRate(state.ascentRate)

  if (gas === 'empty') return { label: 'Out of Gas', tone: 'danger' }
  if (ascent === 'dangerous') return { label: 'Dangerous Ascent', tone: 'danger' }
  if (ascent === 'fast') return { label: 'Fast Ascent', tone: 'warning' }
  if (gas === 'reserve') return { label: 'Reserve Gas', tone: 'warning' }
  if (gas === 'turn') return { label: 'Turn Pressure', tone: 'caution' }
  if (gas === 'low') return { label: 'Low Gas', tone: 'caution' }
  if (state.safetyStop.status === 'in-progress') return { label: 'Safety Stop', tone: 'info' }
  if (state.depth <= SURFACE_DEPTH_M) return { label: 'Surface', tone: 'info' }
  return { label: 'Normal', tone: 'ok' }
}

/** Descending faster than this (m/min) earns a "slow down" hint. */
export const FAST_DESCENT_RATE_MPM = 18
/** Within this distance of the planned depth the diver counts as "at depth". */
export const AT_DEPTH_MARGIN_M = 2

/** One line of coaching for the current moment — shown when no alert is active. */
export function getDiveHint(state: SimulationState, setup: DiveSetup): string {
  const { safetyStop } = state
  const buoyancy = classifyBuoyancy(state.netBuoyancyKg)

  if (canEndDive(state)) return 'Back at the surface. End the dive to see your log.'
  if (!state.hasDescended) {
    return 'Hold Deflate (Shift) to let air out of your BCD and begin your descent.'
  }
  if (state.ascentRate < -FAST_DESCENT_RATE_MPM) {
    return 'Descending fast — add short bursts of air (Space) to slow down.'
  }
  if (safetyStop.status === 'in-progress') {
    return 'Hold between 4.5 and 5.5 m until the timer reaches zero.'
  }
  if (safetyStop.status === 'paused') {
    return 'Safety stop paused — return to 4.5–5.5 m to continue the countdown.'
  }
  if (safetyStop.status === 'complete') {
    return 'Safety stop complete — make a slow final ascent to the surface.'
  }
  if (
    safetyStop.required &&
    state.depth < setup.plan.maxDepth / 2 &&
    !isInSafetyStopZone(state.depth)
  ) {
    return 'Ascend slowly to 5 m for a 3 minute safety stop.'
  }
  if (buoyancy === 'positive' && state.ascentRate > 0) {
    return 'Rising — vent a little air (Shift) or breathe out (S).'
  }
  if (buoyancy === 'negative' && state.ascentRate < 0) {
    return 'Sinking — add a short burst of air (Space) to level off.'
  }
  if (Math.abs(state.depth - setup.plan.maxDepth) <= AT_DEPTH_MARGIN_M) {
    return 'Neutral at depth — fine-tune with your breath (W / S) and watch your gas.'
  }
  return 'Neutral — fine-tune with your breath (W / S).'
}
