// src/store/useScale.ts
import { create } from 'zustand'

export type ScaleType = 'major' | 'minor'
interface ScaleState {
  key: string
  scale: ScaleType
  setScale: (key: string, scale: ScaleType) => void
}

export const useScale = create<ScaleState>((set) => ({
  key: 'C',
  scale: 'major',
  setScale: (key, scale) => set({ key, scale }),
}))
