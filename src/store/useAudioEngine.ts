import { create } from 'zustand'

interface AudioEngineState {
  audioReady: boolean
  setAudioReady: (ready: boolean) => void
}

export const useAudioEngine = create<AudioEngineState>((set) => ({
  audioReady: false,
  setAudioReady: (ready) => set({ audioReady: ready })
}))
