import { ObjectType } from '../store/useObjects'

export interface ObjectConfig {
  color: string
  label: string
}

export const objectConfigs: Record<ObjectType, ObjectConfig> = {
  note: { color: '#4fa3ff', label: 'Note' },
  chord: { color: '#6ee7b7', label: 'Chord' },
  beat: { color: '#a0aec0', label: 'Beat' },
  effect: { color: '#ff9f1c', label: 'Effect' },
  scaleCloud: { color: '#9d4edd', label: 'Scale' },
}

export const objectTypes = Object.keys(objectConfigs) as ObjectType[]
