import type { CurrentStrength, CylinderMaterial, WaterType } from '@/types/dive'

export const WATER_TYPE_LABELS: Record<WaterType, string> = {
  salt: 'Salt',
  fresh: 'Fresh',
}

export const CURRENT_LABELS: Record<CurrentStrength, string> = {
  none: 'None',
  low: 'Low',
  medium: 'Medium',
  strong: 'Strong',
}

export const MATERIAL_LABELS: Record<CylinderMaterial, string> = {
  aluminium: 'Aluminium',
  steel: 'Steel',
}
