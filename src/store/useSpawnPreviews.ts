import { create } from 'zustand'
import { ObjectType } from './useObjects'

export interface PreviewItem {
  id: string
  type: ObjectType
}

interface PreviewState {
  previews: PreviewItem[]
  show: (id: string, type: ObjectType) => void
  remove: (id: string) => void
}

export const useSpawnPreviews = create<PreviewState>((set) => ({
  previews: [],
  show: (id, type) => set((s) => ({ previews: [...s.previews, { id, type }] })),
  remove: (id) =>
    set((s) => ({ previews: s.previews.filter((p) => p.id !== id) })),
}))
