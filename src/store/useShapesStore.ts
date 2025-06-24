import { create } from 'zustand'

export type Shape = {
  id: string
  type: string
  position: [number, number, number]
  scale: number
}

interface ShapesState {
  shapes: Shape[]
  selectedShape: string | null
  addShape: (shape: Shape) => void
  selectShape: (id: string | null) => void
}

export const useShapesStore = create<ShapesState>((set) => ({
  shapes: [],
  selectedShape: null,
  addShape: (shape: Shape) => set((state) => ({ shapes: [...state.shapes, shape] })),
  selectShape: (id: string | null) => set({ selectedShape: id }),
}))

if (typeof window !== 'undefined') {
  ;(window as any).__useShapesStore = useShapesStore
}
