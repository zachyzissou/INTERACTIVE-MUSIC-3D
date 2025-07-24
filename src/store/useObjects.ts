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
  objects: [
    // Create some default interactive shapes for immediate testing
    { id: 'default-note-1', type: 'note', position: [-2, 2, 0] },
    { id: 'default-chord-1', type: 'chord', position: [2, 2, 0] },
    { id: 'default-beat-1', type: 'beat', position: [0, 0, 0] },
    { id: 'default-note-2', type: 'note', position: [-4, 1, -2] },
    { id: 'default-chord-2', type: 'chord', position: [4, 1, -2] },
  ],
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
