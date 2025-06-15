// src/store/useObjects.ts
import { create } from 'zustand'

export type ObjectType = 'note' | 'chord' | 'beat' | 'effect' | 'scaleCloud' | 'loop'
export interface MusicalObject {
  id: string
  type: ObjectType
  position: [number, number, number]
}

interface ObjectState {
  objects: MusicalObject[]
  spawn: (type: ObjectType) => void
}

export const useObjects = create<ObjectState>((set, get) => ({
  objects: [],
  spawn: (type) => {
    const id = Date.now().toString()
    const newObj: MusicalObject = {
      id,
      type,
      position: [0, 3, 0], // default spawn position
    }
    set({ objects: [...get().objects, newObj] })
  },
}))
