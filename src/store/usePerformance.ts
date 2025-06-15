import { create } from 'zustand'

interface PerfState {
  instanced: boolean
  toggleInstanced: () => void
}

export const usePerformance = create<PerfState>((set) => ({
  instanced: true,
  toggleInstanced: () => set((s) => ({ instanced: !s.instanced })),
}))
