import { create } from 'zustand'

export interface Transform {
  position: [number, number, number]
  quaternion: [number, number, number, number]
}

interface PhysicsState {
  transforms: Record<string, Transform>
}

export const usePhysicsStore = create<PhysicsState>(() => ({ transforms: {} }))

export interface BodyUpdate {
  id: string
  position: [number, number, number]
  quaternion: [number, number, number, number]
}

let worker: Worker | null = null

export function initPhysics() {
  if (worker) return
  worker = new Worker(new URL('./physics.worker.ts', import.meta.url))
  worker.onmessage = (e: MessageEvent<BodyUpdate[]>) => {
    const arr = e.data
    const map: Record<string, Transform> = {}
    arr.forEach((t) => {
      map[t.id] = { position: t.position, quaternion: t.quaternion }
    })
    usePhysicsStore.setState({ transforms: map })
  }
}

export function addBody(id: string, position: [number, number, number]) {
  worker?.postMessage({ type: 'add', id, position })
}

export function removeBody(id: string) {
  worker?.postMessage({ type: 'remove', id })
}
