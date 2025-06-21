export type ObjectType = 'note' | 'chord' | 'beat' | 'loop'

export type GeometryType = 'sphere' | 'cube' | 'torus' | 'torusKnot'

export interface ObjectConfig {
  color: string
  label: string
  geometry: GeometryType
  /** Unicode glyph used for text icons */
  icon: string
  pulseIntensity?: number
  /** Base scale applied to the mesh */
  baseScale: number
}

export const objectConfigs: Record<ObjectType, ObjectConfig> = {
  // Slightly smaller notes for a more delicate feel
  note:  { color:'#4fa3ff', label:'Note',  geometry:'sphere',    icon:'\u2669',  pulseIntensity:0.5, baseScale:0.8 },
  // Chords are generally more prominent
  chord: { color:'#6ee7b7', label:'Chord', geometry:'torus',     icon:'\u266C',  pulseIntensity:0.3, baseScale:1.2 },
  // Beats sit between notes and loops
  beat:  { color:'#a0aec0', label:'Beat',  geometry:'cube',      icon:'\u266A',  pulseIntensity:0.7, baseScale:1 },
  // Loops are slightly larger to stand out
  loop:  { color:'#f472b6', label:'Loop',  geometry:'torusKnot', icon:'\u1D106', pulseIntensity:0.4, baseScale:1.1 },
}

export const objectTypes = Object.keys(objectConfigs) as ObjectType[]
