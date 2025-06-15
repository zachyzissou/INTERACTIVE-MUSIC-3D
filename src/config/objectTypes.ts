export type ObjectType = 'note' | 'chord' | 'beat' | 'effect' | 'scaleCloud' | 'loop'

export interface ObjectConfig {
  color: string
  label: string
  geometry: 'sphere' | 'torus'
}

export const objectConfigs: Record<ObjectType, ObjectConfig> = {
  note: { color: '#4fa3ff', label: 'Note', geometry: 'sphere' },
  chord: { color: '#6ee7b7', label: 'Chord', geometry: 'sphere' },
  beat: { color: '#a0aec0', label: 'Beat', geometry: 'sphere' },
  effect: { color: '#ff9f1c', label: 'Effect', geometry: 'sphere' },
  scaleCloud: { color: '#9d4edd', label: 'Scale', geometry: 'sphere' },
  loop: { color: '#f472b6', label: 'Loop', geometry: 'torus' },
}

export const objectTypes = Object.keys(objectConfigs) as ObjectType[]
