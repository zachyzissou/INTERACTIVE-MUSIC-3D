// src/store/useObjects.ts
import { create } from 'zustand'
import { addBody } from "../lib/physics"

/**
 * Store of musical object metadata.
 * Only primitive fields and arrays should be stored here.
 * Complex runtime objects (Three.js, Tone.js, DOM) must be referenced by ID.
 */

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
  spawn: (type: ObjectType, position?: [number, number, number]) => {
    const id = Date.now().toString()
    const newObj: MusicalObject = {
      id,
      type,
      position:
        position ?? ([
          Math.random() * 6 - 3,
          3,
          Math.random() * 6 - 3,
        ] as [number, number, number]),
    }
    const updated = [...get().objects, newObj]
    set({ objects: updated })
    if (typeof window !== 'undefined') {
      localStorage.setItem('objects', JSON.stringify(updated))
      ;(window as any).__objects__ = updated
    }
    addBody(id, newObj.position)
    return id
  },
}))

export function loadObjectsFromStorage() {
  if (typeof window === 'undefined') return
  try {
    const stored = localStorage.getItem('objects')
    if (!stored) return
    const list: MusicalObject[] = JSON.parse(stored)
    useObjects.setState({ objects: list })
    list.forEach((obj) => addBody(obj.id, obj.position))
    ;(window as any).__objects__ = list
  } catch (err) {
    console.error('Failed to load objects from storage', err)
  }
}
