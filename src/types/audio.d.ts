// Audio-related type definitions
import type { Synth, PolySynth, MembraneSynth, Filter, Reverb, FeedbackDelay } from 'tone'

export interface AudioEngine {
  initialized: boolean
  context: AudioContext | null
  masterVolume: number
  effects: AudioEffectsChain
}

export interface AudioEffectsChain {
  reverb: Reverb
  delay: FeedbackDelay
  filter: Filter
  distortion?: any
  chorus?: any
  bitcrusher?: any
}

export interface MusicalObject {
  id: string
  type: 'note' | 'chord' | 'beat' | 'loop'
  position: [number, number, number]
  note: string
  velocity: number
  duration: number
  synth: Synth | PolySynth | MembraneSynth
  isPlaying: boolean
  color: string
  scale: number
}

export interface AudioAnalysis {
  bass: number
  mid: number
  treble: number
  rms: number
  spectralCentroid: number
  zeroCrossingRate: number
  mfcc: Float32Array
  fft: Float32Array
}

export interface MusicalKey {
  root: string
  scale: 'major' | 'minor' | 'dorian' | 'mixolydian' | 'pentatonic' | 'blues'
  notes: string[]
  chords: string[][]
}

export interface AudioSettings {
  masterVolume: number
  tempo: number
  key: string
  scale: string
  effects: {
    reverb: number
    delay: number
    distortion: number
    chorus: number
    filter: number
  }
}

export interface AIModelConfig {
  temperature: number
  topK: number
  topP: number
  seed?: number
  steps: number
  style: 'classical' | 'jazz' | 'electronic' | 'ambient' | 'experimental'
}

export interface GeneratedSequence {
  notes: Array<{
    pitch: number
    velocity: number
    startTime: number
    endTime: number
  }>
  tempo: number
  timeSignature: [number, number]
  key: string
  style: string
}

export {}