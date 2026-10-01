import type { WaterType } from '@/types/dive'

// ── Pressure ────────────────────────────────────────────────────────────────
/** Atmospheric pressure at the surface. */
export const SURFACE_PRESSURE_ATA = 1
/** Simplified: every 10 m of water adds one atmosphere (salinity ignored). */
export const METERS_PER_ATA = 10

// ── Water & displacement ────────────────────────────────────────────────────
/** Approximation used throughout: 1 L of displaced water ≈ 1 kg of lift. */
export const BUOYANCY_KG_PER_LITER = 1
export const WATER_DENSITY_KG_PER_L: Record<WaterType, number> = {
  fresh: 1,
  salt: 1.025,
}

/** Net buoyancy within ± this value reads as neutral. */
export const NEUTRAL_BUOYANCY_TOLERANCE_KG = 0.2
/** Net buoyancy changing faster than this (kg/min) shows as a trend. */
export const BUOYANCY_TREND_THRESHOLD_KG_PER_MIN = 0.3

// ── Gas ─────────────────────────────────────────────────────────────────────
/** Density of air at surface pressure. */
export const AIR_DENSITY_KG_PER_L = 0.001225

// ── Diver body ──────────────────────────────────────────────────────────────
/** Displacement of an average diver (lungs at neutral volume). */
export const BODY_VOLUME_L = 80
/** Mass of the same diver, including regulator and BCD hardware. */
export const BODY_MASS_KG = 81.5

// ── Lungs ───────────────────────────────────────────────────────────────────
export const NEUTRAL_LUNG_VOLUME_L = 3.5
export const MIN_LUNG_VOLUME_L = 2.5
export const MAX_LUNG_VOLUME_L = 5.5
export const LUNG_FILL_RATE_LPS = 1.2
export const LUNG_EMPTY_RATE_LPS = 1.2
/** How fast breathing drifts back to normal once inhale / exhale is released. */
export const LUNG_RECOVERY_RATE_LPS = 0.25
/** Amplitude of the automatic breathing cycle around the lung volume. */
export const TIDAL_VOLUME_AMPLITUDE_L = 0.25
export const BREATH_CYCLE_SECONDS = 5

// ── BCD ─────────────────────────────────────────────────────────────────────
export const BCD_MAX_VOLUME_L = 12
export const BCD_INFLATE_RATE_LPS = 1
export const BCD_DEFLATE_RATE_LPS = 1.5
/** Extra lift the BCD is pre-filled with at the start so the diver floats. */
export const SURFACE_FLOAT_MARGIN_KG = 2.5

// ── Exposure suit ───────────────────────────────────────────────────────────
export const DEFAULT_SUIT_COMPRESSION_FACTOR = 0.35

// ── Motion ──────────────────────────────────────────────────────────────────
/** Acceleration from 1 kg of net buoyancy (≈ g / diver + entrained water mass), m/s². */
export const BUOYANCY_ACCELERATION_PER_KG = 0.06
/** Linear water drag — dominates at low speed and keeps hovering stable, 1/s. */
export const LINEAR_DRAG_PER_S = 0.25
/** Quadratic water drag — limits terminal velocity, 1/m. */
export const QUADRATIC_DRAG_PER_M = 0.8
/** Thrust of steady finning, expressed as equivalent buoyancy in kg. */
export const FIN_THRUST_KG = 1.5
/** Finning raises the breathing rate. */
export const FINNING_WORKLOAD_FACTOR = 1.5

// ── Ascent ──────────────────────────────────────────────────────────────────
export const SAFE_ASCENT_RATE_MPM = 9
export const DANGEROUS_ASCENT_RATE_MPM = 12
/** Ascent rate treated as an uncontrolled (runaway) ascent. */
export const RUNAWAY_ASCENT_RATE_MPM = 18
export const ASCENT_RATE_SMOOTHING_S = 0.75
export const BUOYANCY_TREND_SMOOTHING_S = 1.5

// ── Safety stop ─────────────────────────────────────────────────────────────
export const SAFETY_STOP_TRIGGER_DEPTH_M = 10
export const SAFETY_STOP_MIN_DEPTH_M = 4.5
export const SAFETY_STOP_MAX_DEPTH_M = 5.5
export const SAFETY_STOP_DEPTH_M = 5
export const SAFETY_STOP_DURATION_S = 180

// ── Gas alerts ──────────────────────────────────────────────────────────────
export const LOW_GAS_PRESSURE_BAR = 100
export const TURN_PRESSURE_BAR = 70

// ── Dive lifecycle ──────────────────────────────────────────────────────────
/** The dive computer starts timing once the diver passes this depth. */
export const DIVE_START_DEPTH_M = 1
/** At or above this depth the diver counts as surfaced. */
export const SURFACE_DEPTH_M = 0.3
/** Physics sub-step size; larger frames are split into several steps. */
export const MAX_SIMULATION_STEP_S = 0.05
export const PROFILE_SAMPLE_INTERVAL_S = 2
/** A change of vertical direction larger than this counts as a yo-yo. */
export const DEPTH_REVERSAL_THRESHOLD_M = 3

// ── Units ───────────────────────────────────────────────────────────────────
export const SECONDS_PER_MINUTE = 60
