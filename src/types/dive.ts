export type WaterType = 'salt' | 'fresh'

export type CurrentStrength = 'none' | 'low' | 'medium' | 'strong'

export interface DiveSite {
  id: string
  name: string
  location: string
  description: string
  /** Seabed depth in meters — the diver cannot go deeper than this. */
  maxDepth: number
  waterType: WaterType
  /** Water temperature in °C. */
  temperature: number
  /** Visibility in meters. */
  visibility: number
  current: CurrentStrength
}

export type CylinderMaterial = 'aluminium' | 'steel'

export interface Cylinder {
  id: string
  name: string
  material: CylinderMaterial
  /** Internal (water) volume in liters. */
  waterVolume: number
  /** Rated working pressure in bar. */
  workingPressure: number
  /** Buoyancy of the empty cylinder in water, kg (+ floats, − sinks). */
  emptyBuoyancyKg: number
}

export interface ExposureSuit {
  id: string
  name: string
  /** Buoyancy of the uncompressed suit at the surface, kg. */
  surfaceBuoyancyKg: number
  /** Exponent of the compression curve: buoyancy ∝ 1 / P^factor. */
  compressionFactor: number
}

export interface DivePlan {
  siteId: string
  /** Planned maximum depth, meters. */
  maxDepth: number
  /** Planned bottom time, minutes. */
  bottomTime: number
  /** Starting cylinder pressure, bar. */
  startPressure: number
  /** Pressure at which the dive must be ended, bar. */
  reservePressure: number
  /** Surface air consumption rate, L/min. */
  sacRate: number
  cylinderId: string
  suitId: string
  weightKg: number
}

/** Fully resolved, immutable configuration of one dive. */
export interface DiveSetup {
  plan: DivePlan
  site: DiveSite
  cylinder: Cylinder
  suit: ExposureSuit
}

/** Signed buoyancy contributions in kg (+ lifts, − sinks). */
export interface BuoyancyComponents {
  body: number
  lungs: number
  bcd: number
  wetsuit: number
  cylinder: number
  gas: number
  weights: number
}

export type BuoyancyComponent = keyof BuoyancyComponents

export interface ControlInputs {
  inflate: boolean
  deflate: boolean
  inhale: boolean
  exhale: boolean
  finUp: boolean
  finDown: boolean
}

export type ControlName = keyof ControlInputs

export type SafetyStopStatus = 'not-required' | 'pending' | 'in-progress' | 'paused' | 'complete'

export interface SafetyStopState {
  required: boolean
  remainingSeconds: number
  status: SafetyStopStatus
}

export interface DiveSample {
  /** Dive time in seconds. */
  time: number
  depth: number
  tankPressure: number
  netBuoyancyKg: number
  /** Ascent rate in m/min (+ ascending, − descending). */
  ascentRate: number
}

export interface DiveStats {
  maxAscentRate: number
  /** ∫ depth dt, m·s — used for the average depth. */
  depthTimeIntegral: number
  /** ∫ ambient pressure dt, ATA·min — used for the average SAC. */
  pressureTimeIntegral: number
  /** Surface-equivalent liters sent from the tank into the BCD. */
  bcdGasLiters: number
  secondsOverSafeAscent: number
  secondsOverDangerousAscent: number
  seabedContacts: number
  /** Number of vertical direction changes larger than the reversal threshold. */
  depthReversals: number
  outOfGas: boolean
}

export interface DepthExcursion {
  /** 1 = descending, −1 = ascending, 0 = not yet moving. */
  direction: -1 | 0 | 1
  /** Deepest (or shallowest) depth reached in the current direction. */
  extremeDepth: number
}

export interface SimulationState {
  /** Simulated seconds since the dive was started at the surface. */
  elapsedSeconds: number
  /** Dive computer time — starts once the diver first descends. */
  diveTimeSeconds: number
  hasDescended: boolean
  depth: number
  maxDepth: number
  /** Vertical velocity in m/s (+ up, − down). */
  verticalVelocity: number
  /** Smoothed ascent rate in m/min (+ up, − down). */
  ascentRate: number
  /** Actual BCD gas volume at the current depth, liters. */
  bcdVolume: number
  /** True while the BCD over-pressure valve is venting expanding gas. */
  bcdVenting: boolean
  /** Lung volume the diver is breathing around, liters. */
  lungVolume: number
  /** Phase of the automatic breathing cycle, radians. */
  breathPhase: number
  gasRemainingLiters: number
  tankPressure: number
  gasConsumptionLpm: number
  buoyancy: BuoyancyComponents
  netBuoyancyKg: number
  /** Smoothed rate of change of net buoyancy, kg/min. */
  buoyancyTrend: number
  onSeabed: boolean
  safetyStop: SafetyStopState
  stats: DiveStats
  samples: DiveSample[]
  excursion: DepthExcursion
}

export type DivePhase = 'idle' | 'running' | 'paused'

export type TimeScale = 1 | 2 | 4

export type AssessmentRating = 'good' | 'needs-improvement' | 'unsafe'

export interface Assessment {
  rating: AssessmentRating
  notes: string[]
}

export type SafetyStopOutcome = 'complete' | 'incomplete' | 'not-required'

export interface DiveLog {
  id: string
  /** ISO timestamp of when the dive ended. */
  endedAt: string
  siteId: string
  siteName: string
  cylinderName: string
  suitName: string
  plan: DivePlan
  maxDepth: number
  diveTimeSeconds: number
  startPressure: number
  endPressure: number
  gasUsedLiters: number
  /** Part of the gas used that went into the BCD rather than the diver's lungs. */
  bcdGasLiters: number
  averageDepth: number
  /** Breathing gas only, normalised to surface pressure. */
  averageSac: number
  maxAscentRate: number
  safetyStop: SafetyStopOutcome
  assessments: {
    buoyancy: Assessment
    ascent: Assessment
    gas: Assessment
  }
  profile: DiveSample[]
}
