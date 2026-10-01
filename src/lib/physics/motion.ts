import { BUOYANCY_ACCELERATION_PER_KG, LINEAR_DRAG_PER_S, QUADRATIC_DRAG_PER_M } from './constants'

/** Vertical acceleration (m/s², + up) from a net lifting force, damped by water drag. */
export function calculateVerticalAcceleration(netForceKg: number, velocity: number): number {
  const drag = LINEAR_DRAG_PER_S * velocity + QUADRATIC_DRAG_PER_M * velocity * Math.abs(velocity)
  return netForceKg * BUOYANCY_ACCELERATION_PER_KG - drag
}

export interface VerticalMotion {
  depth: number
  /** m/s, + up. */
  velocity: number
}

export interface VerticalMotionResult extends VerticalMotion {
  atSurface: boolean
  onSeabed: boolean
}

/** Semi-implicit Euler step. The surface and the seabed stop vertical movement. */
export function integrateVerticalMotion(
  motion: VerticalMotion,
  netForceKg: number,
  dt: number,
  seabedDepth: number,
): VerticalMotionResult {
  let velocity = motion.velocity + calculateVerticalAcceleration(netForceKg, motion.velocity) * dt
  let depth = motion.depth - velocity * dt

  const atSurface = depth <= 0
  if (atSurface) {
    depth = 0
    velocity = Math.min(0, velocity)
  }

  const onSeabed = depth >= seabedDepth
  if (onSeabed) {
    depth = seabedDepth
    velocity = Math.max(0, velocity)
  }

  return { depth, velocity, atSurface, onSeabed }
}

/** Velocity a constant net force settles at (m/s, + up) once drag balances it. */
export function calculateTerminalVelocity(netForceKg: number): number {
  const force = Math.abs(netForceKg) * BUOYANCY_ACCELERATION_PER_KG
  const speed =
    (-LINEAR_DRAG_PER_S + Math.sqrt(LINEAR_DRAG_PER_S ** 2 + 4 * QUADRATIC_DRAG_PER_M * force)) /
    (2 * QUADRATIC_DRAG_PER_M)
  return Math.sign(netForceKg) * speed
}
