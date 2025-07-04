import { create } from 'zustand'
import {
  setChorusDepth as setChorusDepthAudio,
  setReverbWet as setReverbWetAudio,
  setDelayFeedback as setDelayFeedbackAudio,
  setBitcrusherBits as setBitcrusherBitsAudio,
  setFilterFrequency as setFilterFrequencyAudio,
} from '../lib/audio'

/**
 * Audio settings store.
 * Only simple primitives are persisted here to keep the state serializable.
 * Do not store Three.js, Tone.js or DOM objects.
 */

export type ScaleType = 'major' | 'minor'

interface AudioSettingsState {
  key: string
  scale: ScaleType
  volume: number
  bpm: number
  chorusDepth: number
  reverbWet: number
  delayFeedback: number
  bitcrusherBits: number
  filterFrequency: number
  setScale: (key: string, scale: ScaleType) => void
  setVolume: (volume: number) => void
  setBpm: (bpm: number) => void
  setChorusDepth: (v: number) => void
  setReverbWet: (v: number) => void
  setDelayFeedback: (v: number) => void
  setBitcrusherBits: (v: number) => void
  setFilterFrequency: (v: number) => void
}

export const useAudioSettings = create<AudioSettingsState>((set) => ({
  key: 'C',
  scale: 'major',
  volume: 0.8,
  bpm: 120,
  chorusDepth: 0.7,
  reverbWet: 0.5,
  delayFeedback: 0.4,
  bitcrusherBits: 4,
  filterFrequency: 200,
  setScale: (key, scale) => set({ key, scale }),
  setVolume: (volume) => set({ volume }),
  setBpm: (bpm) => set({ bpm }),
  setChorusDepth: (v) => {
    set({ chorusDepth: v })
    setChorusDepthAudio(v).catch(console.error)
  },
  setReverbWet: (v) => {
    set({ reverbWet: v })
    setReverbWetAudio(v).catch(console.error)
  },
  setDelayFeedback: (v) => {
    set({ delayFeedback: v })
    setDelayFeedbackAudio(v).catch(console.error)
  },
  setBitcrusherBits: (v) => {
    set({ bitcrusherBits: v })
    setBitcrusherBitsAudio(v).catch(console.error)
  },
  setFilterFrequency: (v) => {
    set({ filterFrequency: v })
    setFilterFrequencyAudio(v).catch(console.error)
  },
}))
