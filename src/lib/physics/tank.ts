import type { Cylinder } from '@/types/dive'

import { AIR_DENSITY_KG_PER_L } from './constants'
import { calculateGasVolume } from './gas'

/** Mass (kg) of the air stored in a cylinder. */
export function calculateTankGasMass(tankVolumeLiters: number, pressureBar: number): number {
  return calculateGasVolume(tankVolumeLiters, pressureBar) * AIR_DENSITY_KG_PER_L
}

export interface TankBuoyancy {
  /** Buoyancy of the empty cylinder, kg. */
  cylinder: number
  /** Weight of the gas inside — always ≤ 0, kg. */
  gas: number
  total: number
}

/** Buoyancy of a cylinder at a given pressure: it gets lighter as gas is used. */
export function calculateTankBuoyancy(
  cylinder: Pick<Cylinder, 'waterVolume' | 'emptyBuoyancyKg'>,
  pressureBar: number,
): TankBuoyancy {
  const gas = -calculateTankGasMass(cylinder.waterVolume, pressureBar)
  return { cylinder: cylinder.emptyBuoyancyKg, gas, total: cylinder.emptyBuoyancyKg + gas }
}
