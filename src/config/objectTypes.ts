export type ObjectType = 'note' | 'chord' | 'beat' | 'loop'

export type GeometryType = 'sphere' | 'cube' | 'torus' | 'torusKnot'

export interface ObjectConfig {
  color: string
  label: string
  geometry: GeometryType
  /** Unicode glyph used for text icons */
  icon: string
  pulseIntensity?: number
}

export const objectConfigs: Record<ObjectType, ObjectConfig> = {
  note:  { color:'#4fa3ff', label:'Note',  geometry:'sphere',    icon:'\u2669',  pulseIntensity:0.5 },
  chord: { color:'#6ee7b7', label:'Chord', geometry:'torus',     icon:'\u266C',  pulseIntensity:0.3 },
  beat:  { color:'#a0aec0', label:'Beat',  geometry:'cube',      icon:'\u266A',  pulseIntensity:0.7 },
  loop:  { color:'#f472b6', label:'Loop',  geometry:'torusKnot', icon:'\u1D106', pulseIntensity:0.4 },
}

export const objectTypes = Object.keys(objectConfigs) as ObjectType[]
