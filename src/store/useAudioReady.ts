import { create } from 'zustand'

interface AudioReadyState {
  audioReady: boolean
  setAudioReady: (ready: boolean) => void
}

export const useAudioReady = create<AudioReadyState>((set) => ({
  audioReady: false,
  setAudioReady: (ready) => set({ audioReady: ready }),
}))
