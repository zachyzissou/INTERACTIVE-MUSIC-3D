import { create } from 'zustand'

interface PerfState {
  instanced: boolean
  toggleInstanced: () => void
}

export const usePerformance = create<PerfState>((set) => ({
  instanced: false,
  toggleInstanced: () => set((s) => ({ instanced: !s.instanced })),
}))
