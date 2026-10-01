import type { Cylinder } from '@/types/dive'

export const CYLINDERS: readonly Cylinder[] = [
  {
    id: 'al80',
    name: 'AL80',
    material: 'aluminium',
    waterVolume: 11.1,
    workingPressure: 207,
    emptyBuoyancyKg: 2.0,
  },
  {
    id: 'steel-12',
    name: 'Steel 12L',
    material: 'steel',
    waterVolume: 12,
    workingPressure: 232,
    emptyBuoyancyKg: -1.3,
  },
  {
    id: 'steel-15',
    name: 'Steel 15L',
    material: 'steel',
    waterVolume: 15,
    workingPressure: 232,
    emptyBuoyancyKg: -1.6,
  },
]

export const DEFAULT_CYLINDER_ID = 'al80'

export function getCylinder(id: string): Cylinder {
  return CYLINDERS.find((cylinder) => cylinder.id === id) ?? CYLINDERS[0]
}
