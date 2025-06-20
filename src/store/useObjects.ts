// src/store/useObjects.ts
import { create } from 'zustand'
import { addBody } from "../lib/physics"

export type ObjectType = 'note' | 'chord' | 'beat' | 'loop'
export interface MusicalObject {
  id: string
  type: ObjectType
  position: [number, number, number]
}

interface ObjectState {
  objects: MusicalObject[]
  /**
   * Spawn a new musical object of the given type and return its id
   */
  spawn: (type: ObjectType, position?: [number, number, number]) => string
}

export const useObjects = create<ObjectState>((set, get) => ({
  objects: [],
  spawn: (type, position) => {
    const id = Date.now().toString()
    const newObj: MusicalObject = {
      id,
      type,
      position: position ?? [0, 3, 0],
    }
    set({ objects: [...get().objects, newObj] })
    addBody(id, newObj.position)
    return id
  },
}))
