import type { IHorse } from '@/models/race'

// TODO(Phase 3): Remove temporary race fixtures and preview logic
// once the real race domain and store are implemented.

export const mockHorses = [
  { id: 1, name: 'Thunderbolt', color: '#c14953', colorName: 'Crimson', condition: 86 },
  { id: 2, name: 'Eclipse', color: '#2d6a8a', colorName: 'Ocean blue', condition: 72 },
  { id: 3, name: 'Storm', color: '#d28b27', colorName: 'Amber', condition: 91 },
  { id: 4, name: 'Wind', color: '#4f772d', colorName: 'Moss green', condition: 64 },
  { id: 5, name: 'Blaze', color: '#c45524', colorName: 'Burnt orange', condition: 78 },
  { id: 6, name: 'Spirit', color: '#287271', colorName: 'Deep teal', condition: 83 },
  { id: 7, name: 'Comet', color: '#b23a48', colorName: 'Garnet', condition: 95 },
  { id: 8, name: 'Apollo', color: '#3d5a80', colorName: 'Slate blue', condition: 69 },
  { id: 9, name: 'Titan', color: '#8f5b34', colorName: 'Chestnut', condition: 88 },
  { id: 10, name: 'Arrow', color: '#52796f', colorName: 'Sage green', condition: 74 },
  { id: 11, name: 'Phoenix', color: '#d1493f', colorName: 'Coral red', condition: 81 },
  { id: 12, name: 'Jasper', color: '#7a6c3b', colorName: 'Olive brown', condition: 67 },
  { id: 13, name: 'Willow', color: '#588157', colorName: 'Fern green', condition: 92 },
  { id: 14, name: 'Onyx', color: '#36454f', colorName: 'Charcoal', condition: 76 },
  { id: 15, name: 'Rio', color: '#1f7a8c', colorName: 'Lagoon blue', condition: 84 },
  { id: 16, name: 'Nova', color: '#a44a3f', colorName: 'Brick red', condition: 71 },
  { id: 17, name: 'Atlas', color: '#6b705c', colorName: 'Field grey', condition: 89 },
  { id: 18, name: 'Ember', color: '#bc6c25', colorName: 'Copper', condition: 79 },
  { id: 19, name: 'Sage', color: '#40916c', colorName: 'Emerald', condition: 66 },
  { id: 20, name: 'Zephyr', color: '#577590', colorName: 'Steel blue', condition: 87 },
] as const satisfies readonly IHorse[]
