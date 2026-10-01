import type { DiveSite } from '@/types/dive'

export const DIVE_SITES: readonly DiveSite[] = [
  {
    id: 'racha-yai',
    name: 'Racha Yai',
    location: 'Phuket, Thailand',
    description: 'Sheltered bays and sandy slopes. Easy conditions for building buoyancy skills.',
    maxDepth: 30,
    waterType: 'salt',
    temperature: 29,
    visibility: 20,
    current: 'low',
  },
  {
    id: 'racha-noi',
    name: 'Racha Noi',
    location: 'Phuket, Thailand',
    description: 'Granite pinnacles dropping past 40 m. Deeper profiles and more gas planning.',
    maxDepth: 40,
    waterType: 'salt',
    temperature: 28,
    visibility: 25,
    current: 'medium',
  },
  {
    id: 'training-pool',
    name: 'Training Pool',
    location: 'Dive centre',
    description: 'Fresh water, flat bottom, no current. Perfect for weighting checks.',
    maxDepth: 5,
    waterType: 'fresh',
    temperature: 27,
    visibility: 30,
    current: 'none',
  },
]

export const DEFAULT_DIVE_SITE_ID = 'racha-yai'

export function getDiveSite(id: string): DiveSite {
  return DIVE_SITES.find((site) => site.id === id) ?? DIVE_SITES[0]
}
