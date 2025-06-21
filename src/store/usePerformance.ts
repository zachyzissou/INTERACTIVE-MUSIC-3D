import { create } from 'zustand'

interface PerfState {
  instanced: boolean
  lod: boolean
  toggleInstanced: () => void
  toggleLod: () => void
}

export const usePerformance = create<PerfState>((set) => ({
  instanced: false,
  lod: true,
  toggleInstanced: () => set((s) => ({ instanced: !s.instanced })),
  toggleLod: () => set((s) => ({ lod: !s.lod })),
}))
