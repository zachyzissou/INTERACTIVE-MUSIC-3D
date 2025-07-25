import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export type MusicalScale = 'major' | 'minor' | 'dorian' | 'mixolydian' | 'pentatonic' | 'blues'
export type MusicalKey = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B'

// Scale intervals (semitones from root)
export const scaleIntervals: Record<MusicalScale, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  pentatonic: [0, 2, 4, 7, 9],
  blues: [0, 3, 5, 6, 7, 10]
}

// Note names with their MIDI numbers (C4 = 60)
export const noteNumbers: Record<MusicalKey, number> = {
  'C': 60, 'C#': 61, 'D': 62, 'D#': 63, 'E': 64, 'F': 65,
  'F#': 66, 'G': 67, 'G#': 68, 'A': 69, 'A#': 70, 'B': 71
}

export interface MusicalPaletteState {
  // Global musical parameters (primitives only)
  key: MusicalKey
  scale: MusicalScale
  tempo: number
  octave: number
  
  // Interaction mode
  mode: 'play' | 'edit' | 'record' | 'sequence'
  
  // Current scale notes (computed from key/scale/octave)
  scaleNotes: string[]
  
  // Actions
  setKey: (key: MusicalKey) => void
  setScale: (scale: MusicalScale) => void
  setTempo: (tempo: number) => void
  setOctave: (octave: number) => void
  setMode: (mode: 'play' | 'edit' | 'record' | 'sequence') => void
  
  // Internal methods
  updateScaleNotes: () => void
  
  // Utility functions
  getNoteInScale: (degree: number) => string
  getFrequency: (note: string) => number
  quantizeToScale: (frequency: number) => string
}

export const useMusicalPalette = create<MusicalPaletteState>()(
  subscribeWithSelector((set, get) => ({
    // Default values
    key: 'C',
    scale: 'major',
    tempo: 120,
    octave: 4,
    mode: 'play',
    scaleNotes: [],

    setKey: (key: MusicalKey) => {
      set({ key })
      get().updateScaleNotes()
    },

    setScale: (scale: MusicalScale) => {
      set({ scale })
      get().updateScaleNotes()
    },

    setTempo: (tempo: number) => {
      const clampedTempo = Math.max(60, Math.min(200, tempo))
      set({ tempo: clampedTempo })
    },
    
    setOctave: (octave: number) => {
      const clampedOctave = Math.max(2, Math.min(7, octave))
      set({ octave: clampedOctave })
      get().updateScaleNotes()
    },
    
    setMode: (mode) => set({ mode }),

    updateScaleNotes: () => {
      const { key, scale, octave } = get()
      const rootNote = noteNumbers[key]
      const intervals = scaleIntervals[scale]
      
      const scaleNotes = intervals.map(interval => {
        const midiNote = rootNote + interval + ((octave - 4) * 12)
        return midiNoteToName(midiNote)
      })
      
      set({ scaleNotes })
    },

    getNoteInScale: (degree: number) => {
      const { scaleNotes } = get()
      if (scaleNotes.length === 0) return 'C4'
      
      const index = ((degree - 1) % scaleNotes.length + scaleNotes.length) % scaleNotes.length
      return scaleNotes[index]
    },

    getFrequency: (note: string) => {
      const midiNote = noteNameToMidi(note)
      return 440 * Math.pow(2, (midiNote - 69) / 12)
    },

    quantizeToScale: (frequency: number) => {
      const { scaleNotes } = get()
      if (scaleNotes.length === 0) return 'C4'
      
      const midiNote = frequencyToMidi(frequency)
      
      // Find closest note in current scale
      let closestNote = scaleNotes[0]
      let minDistance = Infinity
      
      for (const note of scaleNotes) {
        const noteMidi = noteNameToMidi(note)
        const distance = Math.abs(midiNote - noteMidi)
        if (distance < minDistance) {
          minDistance = distance
          closestNote = note
        }
      }
      
      return closestNote
    }
  }))
)

// Utility functions
function midiNoteToName(midiNote: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const octave = Math.floor(midiNote / 12) - 1
  const noteIndex = midiNote % 12
  return `${noteNames[noteIndex]}${octave}`
}

function noteNameToMidi(noteName: string): number {
  const match = noteName.match(/^([A-G]#?)(\d+)$/)
  if (!match) return 60 // Default to C4
  
  const [, note, octaveStr] = match
  const octave = parseInt(octaveStr)
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const noteIndex = noteNames.indexOf(note)
  
  return (octave + 1) * 12 + noteIndex
}

function frequencyToMidi(frequency: number): number {
  return Math.round(69 + 12 * Math.log2(frequency / 440))
}

// Initialize scale notes after store creation
// Use setTimeout to avoid calling during store initialization
if (typeof window !== 'undefined') {
  setTimeout(() => {
    useMusicalPalette.getState().updateScaleNotes()
  }, 0)
}