import { create } from 'zustand'

export type ScaleType = 'major' | 'minor'

interface AudioSettingsState {
  key: string
  scale: ScaleType
  volume: number
  setScale: (key: string, scale: ScaleType) => void
  setVolume: (volume: number) => void
}

export const useAudioSettings = create<AudioSettingsState>((set) => ({
  key: 'C',
  scale: 'major',
  volume: 0.8,
  setScale: (key, scale) => set({ key, scale }),
  setVolume: (volume) => set({ volume }),
}))
