export type ObjectType = 'note' | 'chord' | 'beat' | 'loop'

export type GeometryType = 'sphere' | 'cube' | 'torus' | 'torusKnot'

export interface ObjectConfig {
  color: string
  label: string
  geometry: GeometryType
  pulseIntensity?: number
}

export const objectConfigs: Record<ObjectType, ObjectConfig> = {
  note:  { color:'#4fa3ff', label:'Note',  geometry:'sphere',    pulseIntensity:0.5 },
  chord: { color:'#6ee7b7', label:'Chord', geometry:'torus',     pulseIntensity:0.3 },
  beat:  { color:'#a0aec0', label:'Beat',  geometry:'cube',      pulseIntensity:0.7 },
  loop:  { color:'#f472b6', label:'Loop',  geometry:'torusKnot', pulseIntensity:0.4 },
}

export const objectTypes = Object.keys(objectConfigs) as ObjectType[]
