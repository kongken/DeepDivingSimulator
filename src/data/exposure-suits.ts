import { DEFAULT_SUIT_COMPRESSION_FACTOR } from '@/lib/physics/constants'
import type { ExposureSuit } from '@/types/dive'

export const EXPOSURE_SUITS: readonly ExposureSuit[] = [
  { id: 'none', name: 'None', surfaceBuoyancyKg: 0, compressionFactor: 0 },
  {
    id: 'wetsuit-3mm',
    name: '3mm Wetsuit',
    surfaceBuoyancyKg: 2,
    compressionFactor: DEFAULT_SUIT_COMPRESSION_FACTOR,
  },
  {
    id: 'wetsuit-5mm',
    name: '5mm Wetsuit',
    surfaceBuoyancyKg: 3.5,
    compressionFactor: DEFAULT_SUIT_COMPRESSION_FACTOR,
  },
  {
    id: 'wetsuit-7mm',
    name: '7mm Wetsuit',
    surfaceBuoyancyKg: 5,
    compressionFactor: DEFAULT_SUIT_COMPRESSION_FACTOR,
  },
]

export const DEFAULT_SUIT_ID = 'wetsuit-3mm'

export function getExposureSuit(id: string): ExposureSuit {
  return EXPOSURE_SUITS.find((suit) => suit.id === id) ?? EXPOSURE_SUITS[0]
}
