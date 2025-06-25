import { create } from 'zustand'

interface SelectedShapeState {
  selected: string | null
  selectShape: (id: string | null) => void
}

export const useSelectedShape = create<SelectedShapeState>((set) => ({
  selected: null,
  selectShape: (id: string | null) => set({ selected: id }),
}))
