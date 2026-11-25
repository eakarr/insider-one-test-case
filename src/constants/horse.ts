export const HORSE_POOL_SIZE = 20
export const HORSE_CONDITION_RANGE = { min: 1, max: 100 } as const

export const HORSE_IDENTITIES = [
  { id: 1, name: 'Thunderbolt', color: '#c14953', colorName: 'Crimson' },
  { id: 2, name: 'Eclipse', color: '#2d6a8a', colorName: 'Ocean blue' },
  { id: 3, name: 'Storm', color: '#d28b27', colorName: 'Amber' },
  { id: 4, name: 'Wind', color: '#4f772d', colorName: 'Moss green' },
  { id: 5, name: 'Blaze', color: '#c45524', colorName: 'Burnt orange' },
  { id: 6, name: 'Spirit', color: '#287271', colorName: 'Deep teal' },
  { id: 7, name: 'Comet', color: '#b23a48', colorName: 'Garnet' },
  { id: 8, name: 'Apollo', color: '#3d5a80', colorName: 'Slate blue' },
  { id: 9, name: 'Titan', color: '#8f5b34', colorName: 'Chestnut' },
  { id: 10, name: 'Arrow', color: '#52796f', colorName: 'Sage green' },
  { id: 11, name: 'Phoenix', color: '#d1493f', colorName: 'Coral red' },
  { id: 12, name: 'Jasper', color: '#7a6c3b', colorName: 'Olive brown' },
  { id: 13, name: 'Willow', color: '#588157', colorName: 'Fern green' },
  { id: 14, name: 'Onyx', color: '#36454f', colorName: 'Charcoal' },
  { id: 15, name: 'Rio', color: '#1f7a8c', colorName: 'Lagoon blue' },
  { id: 16, name: 'Nova', color: '#a44a3f', colorName: 'Brick red' },
  { id: 17, name: 'Atlas', color: '#6b705c', colorName: 'Field grey' },
  { id: 18, name: 'Ember', color: '#bc6c25', colorName: 'Copper' },
  { id: 19, name: 'Sage', color: '#40916c', colorName: 'Emerald' },
  { id: 20, name: 'Zephyr', color: '#577590', colorName: 'Steel blue' },
] as const satisfies { readonly length: typeof HORSE_POOL_SIZE }
