import {
  DANGEROUS_ASCENT_RATE_MPM,
  RUNAWAY_ASCENT_RATE_MPM,
  SAFE_ASCENT_RATE_MPM,
} from '@/lib/physics/constants'
import { calculateGasVolume } from '@/lib/physics/gas'
import type {
  Assessment,
  AssessmentRating,
  DiveLog,
  DiveSample,
  DiveSetup,
  SafetyStopOutcome,
  SafetyStopState,
  SimulationState,
} from '@/types/dive'

export const LOG_PROFILE_MAX_POINTS = 240
export const DEPTH_OVERSHOOT_UNSAFE_M = 3
export const DEPTH_OVERSHOOT_WARNING_M = 1
export const YO_YO_REVERSAL_LIMIT = 3
/** Seconds above the dangerous ascent rate that count as an unsafe ascent. */
export const SUSTAINED_DANGEROUS_ASCENT_S = 3
/** Seconds above the safe ascent rate that count as a poorly controlled ascent. */
export const SUSTAINED_FAST_ASCENT_S = 5

const RATING_SEVERITY: Record<AssessmentRating, number> = {
  good: 0,
  'needs-improvement': 1,
  unsafe: 2,
}

interface Finding {
  rating: AssessmentRating
  note: string
}

/** The most severe of several ratings. */
export function getWorstRating(ratings: readonly AssessmentRating[]): AssessmentRating {
  return ratings.reduce<AssessmentRating>(
    (worst, rating) => (RATING_SEVERITY[rating] > RATING_SEVERITY[worst] ? rating : worst),
    'good',
  )
}

/** Overall verdict of a logged dive — its weakest skill. */
export function getOverallRating(log: Pick<DiveLog, 'assessments'>): AssessmentRating {
  return getWorstRating(Object.values(log.assessments).map((assessment) => assessment.rating))
}

function summarize(findings: Finding[], goodNote: string): Assessment {
  if (findings.length === 0) return { rating: 'good', notes: [goodNote] }
  return {
    rating: getWorstRating(findings.map((finding) => finding.rating)),
    notes: findings.map((finding) => finding.note),
  }
}

export interface BuoyancyControlInput {
  maxDepth: number
  plannedMaxDepth: number
  maxAscentRate: number
  depthReversals: number
  seabedContacts: number
}

export function assessBuoyancyControl(input: BuoyancyControlInput): Assessment {
  const findings: Finding[] = []
  const overshoot = input.maxDepth - input.plannedMaxDepth

  if (overshoot > DEPTH_OVERSHOOT_UNSAFE_M) {
    findings.push({
      rating: 'unsafe',
      note: `Overshot the planned depth by ${overshoot.toFixed(1)} m.`,
    })
  } else if (overshoot > DEPTH_OVERSHOOT_WARNING_M) {
    findings.push({
      rating: 'needs-improvement',
      note: `Went ${overshoot.toFixed(1)} m deeper than planned.`,
    })
  }
  if (input.maxAscentRate >= RUNAWAY_ASCENT_RATE_MPM) {
    findings.push({
      rating: 'unsafe',
      note: `Runaway ascent at ${input.maxAscentRate.toFixed(0)} m/min — vent the BCD as the air expands.`,
    })
  }
  if (input.depthReversals >= YO_YO_REVERSAL_LIMIT) {
    findings.push({
      rating: 'needs-improvement',
      note: `Yo-yo profile with ${input.depthReversals} large changes of direction.`,
    })
  }
  if (input.seabedContacts > 0) {
    findings.push({
      rating: 'needs-improvement',
      note: `Touched the bottom ${input.seabedContacts} time${input.seabedContacts === 1 ? '' : 's'}.`,
    })
  }

  return summarize(findings, 'Stayed within the planned depth with a steady profile.')
}

export interface AscentControlInput {
  maxAscentRate: number
  secondsOverSafeAscent: number
  secondsOverDangerousAscent: number
  safetyStop: SafetyStopOutcome
}

export function assessAscentControl(input: AscentControlInput): Assessment {
  const findings: Finding[] = []

  if (input.secondsOverDangerousAscent >= SUSTAINED_DANGEROUS_ASCENT_S) {
    findings.push({
      rating: 'unsafe',
      note: `Ascended faster than ${DANGEROUS_ASCENT_RATE_MPM} m/min for ${Math.round(input.secondsOverDangerousAscent)} s.`,
    })
  } else if (input.secondsOverSafeAscent >= SUSTAINED_FAST_ASCENT_S) {
    findings.push({
      rating: 'needs-improvement',
      note: `Exceeded ${SAFE_ASCENT_RATE_MPM} m/min for ${Math.round(input.secondsOverSafeAscent)} s.`,
    })
  }
  if (input.safetyStop === 'incomplete') {
    findings.push({
      rating: 'needs-improvement',
      note: 'Skipped or cut short the 3 minute safety stop.',
    })
  }

  const stopNote = input.safetyStop === 'complete' ? ' Safety stop completed.' : ''
  return summarize(findings, `Ascent stayed at or below ${SAFE_ASCENT_RATE_MPM} m/min.${stopNote}`)
}

export interface GasManagementInput {
  endPressure: number
  reservePressure: number
  outOfGas: boolean
}

export function assessGasManagement(input: GasManagementInput): Assessment {
  const endPressure = Math.round(input.endPressure)
  if (input.outOfGas) {
    return { rating: 'unsafe', notes: ['Ran out of gas during the dive.'] }
  }
  if (input.endPressure < input.reservePressure) {
    return {
      rating: 'needs-improvement',
      notes: [
        `Surfaced with ${endPressure} bar — below your ${input.reservePressure} bar reserve.`,
      ],
    }
  }
  return {
    rating: 'good',
    notes: [`Surfaced with ${endPressure} bar, above your ${input.reservePressure} bar reserve.`],
  }
}

export function getSafetyStopOutcome(stop: SafetyStopState): SafetyStopOutcome {
  if (!stop.required) return 'not-required'
  return stop.status === 'complete' ? 'complete' : 'incomplete'
}

/** Keeps at most `maxPoints` samples, always including the first and last one. */
export function downsampleProfile(samples: DiveSample[], maxPoints: number): DiveSample[] {
  if (samples.length <= maxPoints) return samples
  const stride = (samples.length - 1) / (maxPoints - 1)
  return Array.from({ length: maxPoints }, (_, index) => samples[Math.round(index * stride)])
}

export interface DiveLogMeta {
  id: string
  endedAt: string
}

export function createDiveLog(
  state: SimulationState,
  setup: DiveSetup,
  meta: DiveLogMeta,
): DiveLog {
  const { plan, site, cylinder, suit } = setup
  const { stats } = state
  const startGas = calculateGasVolume(cylinder.waterVolume, plan.startPressure)
  const gasUsedLiters = Math.max(0, startGas - state.gasRemainingLiters)
  const breathingGasLiters = Math.max(0, gasUsedLiters - stats.bcdGasLiters)
  const safetyStop = getSafetyStopOutcome(state.safetyStop)
  const finalSample: DiveSample = {
    time: state.diveTimeSeconds,
    depth: state.depth,
    tankPressure: state.tankPressure,
    netBuoyancyKg: state.netBuoyancyKg,
    ascentRate: state.ascentRate,
  }

  return {
    id: meta.id,
    endedAt: meta.endedAt,
    siteId: site.id,
    siteName: site.name,
    cylinderName: cylinder.name,
    suitName: suit.name,
    plan,
    maxDepth: state.maxDepth,
    diveTimeSeconds: state.diveTimeSeconds,
    startPressure: plan.startPressure,
    endPressure: state.tankPressure,
    gasUsedLiters,
    bcdGasLiters: stats.bcdGasLiters,
    averageDepth: state.diveTimeSeconds > 0 ? stats.depthTimeIntegral / state.diveTimeSeconds : 0,
    averageSac:
      stats.pressureTimeIntegral > 0 ? breathingGasLiters / stats.pressureTimeIntegral : 0,
    maxAscentRate: stats.maxAscentRate,
    safetyStop,
    assessments: {
      buoyancy: assessBuoyancyControl({
        maxDepth: state.maxDepth,
        plannedMaxDepth: plan.maxDepth,
        maxAscentRate: stats.maxAscentRate,
        depthReversals: stats.depthReversals,
        seabedContacts: stats.seabedContacts,
      }),
      ascent: assessAscentControl({
        maxAscentRate: stats.maxAscentRate,
        secondsOverSafeAscent: stats.secondsOverSafeAscent,
        secondsOverDangerousAscent: stats.secondsOverDangerousAscent,
        safetyStop,
      }),
      gas: assessGasManagement({
        endPressure: state.tankPressure,
        reservePressure: plan.reservePressure,
        outOfGas: stats.outOfGas,
      }),
    },
    profile: downsampleProfile([...state.samples, finalSample], LOG_PROFILE_MAX_POINTS),
  }
}
