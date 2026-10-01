import { calculateAmbientPressure } from './pressure'

/** Gas actually breathed per minute at depth: SAC × ambient pressure × workload. */
export function calculateGasConsumption(
  sacRate: number,
  depthMeters: number,
  workload = 1,
): number {
  return sacRate * calculateAmbientPressure(depthMeters) * workload
}

/** Surface-equivalent gas volume (L) stored in a cylinder. */
export function calculateGasVolume(cylinderVolumeLiters: number, pressureBar: number): number {
  return cylinderVolumeLiters * Math.max(0, pressureBar)
}

/** Cylinder pressure (bar) for a given amount of surface-equivalent gas. */
export function calculateTankPressure(
  gasRemainingLiters: number,
  cylinderVolumeLiters: number,
): number {
  return Math.max(0, gasRemainingLiters / cylinderVolumeLiters)
}

/** Remaining gas after breathing `consumptionLpm` for `elapsedMinutes`. Never below zero. */
export function consumeGas(
  gasRemainingLiters: number,
  consumptionLpm: number,
  elapsedMinutes: number,
): number {
  return Math.max(0, gasRemainingLiters - consumptionLpm * elapsedMinutes)
}

/** How long (min) a quantity of gas lasts at a constant depth. */
export function calculateGasDurationMinutes(
  gasLiters: number,
  sacRate: number,
  depthMeters: number,
): number {
  const consumption = calculateGasConsumption(sacRate, depthMeters)
  return consumption > 0 ? Math.max(0, gasLiters) / consumption : Infinity
}
