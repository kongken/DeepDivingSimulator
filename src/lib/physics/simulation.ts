import type {
  ControlInputs,
  DepthExcursion,
  DiveSample,
  DiveSetup,
  DiveStats,
  SimulationState,
} from '@/types/dive'

import { applyBcdControls, calculateBoyleVolume, limitBcdVolume } from './bcd'
import { advanceBreathPhase, calculateTidalOffset, updateLungVolume } from './breathing'
import { type BuoyancyInput, calculateBuoyancyComponents, calculateNetBuoyancy } from './buoyancy'
import {
  ASCENT_RATE_SMOOTHING_S,
  BUOYANCY_TREND_SMOOTHING_S,
  DANGEROUS_ASCENT_RATE_MPM,
  DEPTH_REVERSAL_THRESHOLD_M,
  DIVE_START_DEPTH_M,
  FIN_THRUST_KG,
  FINNING_WORKLOAD_FACTOR,
  MAX_SIMULATION_STEP_S,
  NEUTRAL_LUNG_VOLUME_L,
  PROFILE_SAMPLE_INTERVAL_S,
  SAFE_ASCENT_RATE_MPM,
  SECONDS_PER_MINUTE,
  SURFACE_DEPTH_M,
  SURFACE_FLOAT_MARGIN_KG,
} from './constants'
import {
  calculateGasConsumption,
  calculateGasVolume,
  calculateTankPressure,
  consumeGas,
} from './gas'
import { integrateVerticalMotion } from './motion'
import { calculateAmbientPressure } from './pressure'
import { createSafetyStop, updateSafetyStop } from './safety'

export const IDLE_CONTROLS: Readonly<ControlInputs> = {
  inflate: false,
  deflate: false,
  inhale: false,
  exhale: false,
  finUp: false,
  finDown: false,
}

interface DiverState {
  depth: number
  lungVolume: number
  bcdVolume: number
  tankPressure: number
}

function toBuoyancyInput(setup: DiveSetup, diver: DiverState): BuoyancyInput {
  return {
    ...diver,
    waterType: setup.site.waterType,
    suit: setup.suit,
    cylinder: setup.cylinder,
    weightKg: setup.plan.weightKg,
  }
}

/**
 * BCD volume (L) that makes the diver exactly neutral at a depth. Negative when the
 * diver is already positive with an empty BCD.
 */
export function calculateNeutralBcdVolume(
  setup: DiveSetup,
  depth: number,
  tankPressure: number,
  lungVolume = NEUTRAL_LUNG_VOLUME_L,
): number {
  const liftWithEmptyBcd = calculateNetBuoyancy(
    calculateBuoyancyComponents(
      toBuoyancyInput(setup, { depth, lungVolume, bcdVolume: 0, tankPressure }),
    ),
  )
  return -liftWithEmptyBcd
}

/** BCD volume that leaves the diver floating comfortably at the surface before descent. */
export function calculateSurfaceFloatBcdVolume(setup: DiveSetup): number {
  const neutralVolume = calculateNeutralBcdVolume(setup, 0, setup.plan.startPressure)
  return limitBcdVolume(neutralVolume + SURFACE_FLOAT_MARGIN_KG).volume
}

export function createInitialStats(): DiveStats {
  return {
    maxAscentRate: 0,
    depthTimeIntegral: 0,
    pressureTimeIntegral: 0,
    bcdGasLiters: 0,
    secondsOverSafeAscent: 0,
    secondsOverDangerousAscent: 0,
    seabedContacts: 0,
    depthReversals: 0,
    outOfGas: false,
  }
}

/** The diver floating at the surface, kitted up and ready to descend. */
export function createInitialSimulation(setup: DiveSetup): SimulationState {
  const { plan, cylinder } = setup
  const bcdVolume = calculateSurfaceFloatBcdVolume(setup)
  const buoyancy = calculateBuoyancyComponents(
    toBuoyancyInput(setup, {
      depth: 0,
      lungVolume: NEUTRAL_LUNG_VOLUME_L,
      bcdVolume,
      tankPressure: plan.startPressure,
    }),
  )

  return {
    elapsedSeconds: 0,
    diveTimeSeconds: 0,
    hasDescended: false,
    depth: 0,
    maxDepth: 0,
    verticalVelocity: 0,
    ascentRate: 0,
    bcdVolume,
    bcdVenting: false,
    lungVolume: NEUTRAL_LUNG_VOLUME_L,
    breathPhase: 0,
    gasRemainingLiters: calculateGasVolume(cylinder.waterVolume, plan.startPressure),
    tankPressure: plan.startPressure,
    gasConsumptionLpm: calculateGasConsumption(plan.sacRate, 0),
    buoyancy,
    netBuoyancyKg: calculateNetBuoyancy(buoyancy),
    buoyancyTrend: 0,
    onSeabed: false,
    safetyStop: createSafetyStop(),
    stats: createInitialStats(),
    samples: [],
    excursion: { direction: 0, extremeDepth: 0 },
  }
}

/** Exponential smoothing that is independent of the step size. */
function smooth(current: number, target: number, dt: number, timeConstant: number): number {
  return current + (target - current) * (1 - Math.exp(-dt / timeConstant))
}

export interface ExcursionUpdate {
  excursion: DepthExcursion
  reversed: boolean
}

/** Detects yo-yo diving: a change of vertical direction larger than the reversal threshold. */
export function trackDepthExcursion(excursion: DepthExcursion, depth: number): ExcursionUpdate {
  const { direction, extremeDepth } = excursion
  const delta = depth - extremeDepth

  if (direction === 0) {
    if (Math.abs(delta) < DEPTH_REVERSAL_THRESHOLD_M) return { excursion, reversed: false }
    return { excursion: { direction: delta > 0 ? 1 : -1, extremeDepth: depth }, reversed: false }
  }
  if (delta * direction > 0) {
    return { excursion: { direction, extremeDepth: depth }, reversed: false }
  }
  if (Math.abs(delta) >= DEPTH_REVERSAL_THRESHOLD_M) {
    return {
      excursion: { direction: direction === 1 ? -1 : 1, extremeDepth: depth },
      reversed: true,
    }
  }
  return { excursion, reversed: false }
}

function recordSample(samples: DiveSample[], sample: DiveSample): DiveSample[] {
  const last = samples.at(-1)
  if (last && sample.time - last.time < PROFILE_SAMPLE_INTERVAL_S) return samples
  return [...samples, sample]
}

function isFinning(controls: ControlInputs): boolean {
  return controls.finUp !== controls.finDown
}

function integrateStep(
  state: SimulationState,
  controls: ControlInputs,
  setup: DiveSetup,
  dt: number,
): SimulationState {
  const { plan, site, cylinder } = setup
  const startPressure = calculateAmbientPressure(state.depth)

  // Breathing: the controlled lung volume plus the automatic breathing cycle.
  const lungVolume = updateLungVolume(state.lungVolume, controls, dt)
  const breathPhase = advanceBreathPhase(state.breathPhase, dt)

  // BCD buttons — inflating draws gas from the tank at ambient pressure.
  const bcd = applyBcdControls(state.bcdVolume, controls, state.depth, state.gasRemainingLiters, dt)

  const finning = isFinning(controls)
  const gasConsumptionLpm = calculateGasConsumption(
    plan.sacRate,
    state.depth,
    finning ? FINNING_WORKLOAD_FACTOR : 1,
  )
  const gasRemainingLiters = consumeGas(
    state.gasRemainingLiters - bcd.gasDrawnLiters,
    gasConsumptionLpm,
    dt / SECONDS_PER_MINUTE,
  )
  const tankPressure = calculateTankPressure(gasRemainingLiters, cylinder.waterVolume)

  // Forces and motion.
  const liftKg = calculateNetBuoyancy(
    calculateBuoyancyComponents(
      toBuoyancyInput(setup, {
        depth: state.depth,
        lungVolume: lungVolume + calculateTidalOffset(breathPhase),
        bcdVolume: bcd.volume,
        tankPressure,
      }),
    ),
  )
  const finThrustKg = finning ? (controls.finUp ? FIN_THRUST_KG : -FIN_THRUST_KG) : 0
  const motion = integrateVerticalMotion(
    { depth: state.depth, velocity: state.verticalVelocity },
    liftKg + finThrustKg,
    dt,
    site.maxDepth,
  )
  const ambientPressure = calculateAmbientPressure(motion.depth)

  // Boyle's law: BCD gas expands on the way up and compresses on the way down.
  const bcdLimit = limitBcdVolume(calculateBoyleVolume(bcd.volume, startPressure, ambientPressure))

  // Displayed buoyancy — without the breathing-cycle wobble so the readout stays calm.
  const buoyancy = calculateBuoyancyComponents(
    toBuoyancyInput(setup, {
      depth: motion.depth,
      lungVolume,
      bcdVolume: bcdLimit.volume,
      tankPressure,
    }),
  )
  const netBuoyancyKg = calculateNetBuoyancy(buoyancy)
  const buoyancyTrend = smooth(
    state.buoyancyTrend,
    ((netBuoyancyKg - state.netBuoyancyKg) / dt) * SECONDS_PER_MINUTE,
    dt,
    BUOYANCY_TREND_SMOOTHING_S,
  )
  const ascentRate = smooth(
    state.ascentRate,
    motion.velocity * SECONDS_PER_MINUTE,
    dt,
    ASCENT_RATE_SMOOTHING_S,
  )

  // Dive lifecycle and statistics.
  const hasDescended = state.hasDescended || motion.depth >= DIVE_START_DEPTH_M
  const underwater = hasDescended && motion.depth > SURFACE_DEPTH_M
  const diveTimeSeconds = underwater ? state.diveTimeSeconds + dt : state.diveTimeSeconds
  const maxDepth = Math.max(state.maxDepth, motion.depth)
  const tracked = trackDepthExcursion(state.excursion, motion.depth)

  const stats: DiveStats = {
    maxAscentRate: hasDescended
      ? Math.max(state.stats.maxAscentRate, ascentRate)
      : state.stats.maxAscentRate,
    depthTimeIntegral: state.stats.depthTimeIntegral + (underwater ? motion.depth * dt : 0),
    pressureTimeIntegral:
      state.stats.pressureTimeIntegral + (ambientPressure * dt) / SECONDS_PER_MINUTE,
    bcdGasLiters: state.stats.bcdGasLiters + bcd.gasDrawnLiters,
    secondsOverSafeAscent:
      state.stats.secondsOverSafeAscent + (ascentRate > SAFE_ASCENT_RATE_MPM ? dt : 0),
    secondsOverDangerousAscent:
      state.stats.secondsOverDangerousAscent + (ascentRate > DANGEROUS_ASCENT_RATE_MPM ? dt : 0),
    seabedContacts: state.stats.seabedContacts + (motion.onSeabed && !state.onSeabed ? 1 : 0),
    depthReversals: state.stats.depthReversals + (tracked.reversed ? 1 : 0),
    outOfGas: state.stats.outOfGas || tankPressure <= 0,
  }

  const samples = underwater
    ? recordSample(state.samples, {
        time: diveTimeSeconds,
        depth: motion.depth,
        tankPressure,
        netBuoyancyKg,
        ascentRate,
      })
    : state.samples

  return {
    elapsedSeconds: state.elapsedSeconds + dt,
    diveTimeSeconds,
    hasDescended,
    depth: motion.depth,
    maxDepth,
    verticalVelocity: motion.velocity,
    ascentRate,
    bcdVolume: bcdLimit.volume,
    bcdVenting: bcdLimit.vented,
    lungVolume,
    breathPhase,
    gasRemainingLiters,
    tankPressure,
    gasConsumptionLpm,
    buoyancy,
    netBuoyancyKg,
    buoyancyTrend,
    onSeabed: motion.onSeabed,
    safetyStop: updateSafetyStop(state.safetyStop, motion.depth, maxDepth, dt),
    stats,
    samples,
    excursion: tracked.excursion,
  }
}

/**
 * Advances the simulation by `dtSeconds` of simulated time. Large frames are split
 * into fixed-size sub-steps so the result does not depend on the frame rate.
 */
export function stepSimulation(
  state: SimulationState,
  controls: ControlInputs,
  setup: DiveSetup,
  dtSeconds: number,
): SimulationState {
  if (dtSeconds <= 0) return state

  const steps = Math.ceil(dtSeconds / MAX_SIMULATION_STEP_S)
  const dt = dtSeconds / steps
  let next = state
  for (let step = 0; step < steps; step += 1) {
    next = integrateStep(next, controls, setup, dt)
  }
  return next
}

/** The dive can be logged once the diver has been down and is back at the surface. */
export function canEndDive(state: SimulationState): boolean {
  return state.hasDescended && state.depth <= SURFACE_DEPTH_M
}
