// src/lib/aiMelodyGenerator.ts
import { generateMelody, generateChord, scales } from './enhancedAudio'
import { logger } from './logger'

export interface MelodyPattern {
  notes: string[]
  durations: number[]
  velocities: number[]
  intervals: number[]
}

export interface ChordProgression {
  chords: string[][]
  durations: number[]
  functions: ('I' | 'ii' | 'iii' | 'IV' | 'V' | 'vi' | 'vii°')[]
}

// Markov chain for melody generation
class MelodyMarkovChain {
  private readonly transitions: Map<string, Map<string, number>> = new Map()
  
  addSequence(notes: string[]) {
    for (let i = 0; i < notes.length - 1; i++) {
      const current = notes[i]
      const next = notes[i + 1]
      
      if (!this.transitions.has(current)) {
        this.transitions.set(current, new Map())
      }
      
      const nextMap = this.transitions.get(current)!
      nextMap.set(next, (nextMap.get(next) || 0) + 1)
    }
  }
  
  generateNext(current: string): string {
    const nextMap = this.transitions.get(current)
    if (!nextMap || nextMap.size === 0) {
      // Fallback to random note from scale
      const scaleNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
      return scaleNotes[Math.floor(Math.random() * scaleNotes.length)] + '4'
    }
    
    // Weighted random selection
    const totalWeight = Array.from(nextMap.values()).reduce((sum, weight) => sum + weight, 0)
    let random = Math.random() * totalWeight
    
    for (const entry of Array.from(nextMap.entries())) {
      const [note, weight] = entry
      random -= weight
      if (random <= 0) {
        return note
      }
    }
    
    return Array.from(nextMap.keys())[0] // Fallback
  }
}

// Music theory utilities
export const musicTheory = {
  // Common chord progressions
  progressions: {
    pop: ['I', 'V', 'vi', 'IV'],
    jazz: ['ii', 'V', 'I', 'vi'],
    blues: ['I', 'I', 'I', 'I', 'IV', 'IV', 'I', 'I', 'V', 'IV', 'I', 'I'],
    classical: ['I', 'vi', 'IV', 'V']
  },
  
  // Scale degrees to chord mapping
  chordMap: {
    'I': [0, 2, 4],
    'ii': [1, 3, 5],
    'iii': [2, 4, 6],
    'IV': [3, 5, 0],
    'V': [4, 6, 1],
    'vi': [5, 0, 2],
    'vii°': [6, 1, 3]
  },
  
  // Generate chord from scale degree
  getChord(degree: string, scale: number[], rootNote: string): string[] {
    const intervals = this.chordMap[degree as keyof typeof this.chordMap]
    if (!intervals) return [rootNote]
    
    const noteNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
    const rootIndex = noteNames.indexOf(rootNote.charAt(0))
    
    return intervals.map(interval => {
      const scaleIndex = (rootIndex + interval) % scale.length
      const noteName = noteNames[(rootIndex + scale[scaleIndex]) % 7]
      return noteName + '4'
    })
  }
}

// Rhythm patterns
export const rhythmPatterns = {
  basic: [0.25, 0.25, 0.5],
  swing: [0.33, 0.17, 0.5],
  syncopated: [0.125, 0.25, 0.125, 0.5],
  triplets: [0.33, 0.33, 0.34],
  dotted: [0.375, 0.125, 0.5]
}

export class AIComposer {
  private readonly melodyChain = new MelodyMarkovChain()
  
  constructor() {
    this.trainWithSampleMelodies()
  }
  
  private trainWithSampleMelodies() {
    // Train with some common melodic patterns
    const samples = [
      ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
      ['G4', 'E4', 'C4', 'D4', 'F4', 'E4', 'D4', 'C4'],
      ['C4', 'E4', 'G4', 'E4', 'F4', 'D4', 'G4', 'C4'],
      ['A4', 'G4', 'F4', 'E4', 'D4', 'C4', 'D4', 'E4']
    ]
    
    samples.forEach(melody => this.melodyChain.addSequence(melody))
  }
  
  generateMelody(options: {
    length?: number
    scale?: number[]
    rootNote?: string
    style?: 'classical' | 'jazz' | 'pop' | 'ambient'
    complexity?: 'simple' | 'moderate' | 'complex'
  } = {}): MelodyPattern {
    const {
      length = 8,
      scale = scales.major,
      rootNote = 'C4',
      style = 'pop',
      complexity = 'moderate'
    } = options
    
    const notes: string[] = []
    const durations: number[] = []
    const velocities: number[] = []
    const intervals: number[] = []
    
    // Choose rhythm pattern based on style
    let rhythmPattern = rhythmPatterns.basic
    if (style === 'jazz') rhythmPattern = rhythmPatterns.swing
    else if (style === 'ambient') rhythmPattern = [0.5, 0.5, 1.0]
    else if (complexity === 'complex') rhythmPattern = rhythmPatterns.syncopated
    
    let currentNote = rootNote
    
    for (let i = 0; i < length; i++) {
      // Generate next note using Markov chain with some randomness
      if (Math.random() < 0.7) {
        currentNote = this.melodyChain.generateNext(currentNote)
      } else {
        // Occasionally jump to a random scale note for variety
        const scaleNotes = generateMelody(scale, rootNote, 1)
        currentNote = scaleNotes[0]
      }
      
      notes.push(currentNote)
      
      // Add rhythm variation
      const baseRhythm = rhythmPattern[i % rhythmPattern.length]
      const rhythmVariation = complexity === 'simple' ? 1 : (0.8 + Math.random() * 0.4)
      durations.push(baseRhythm * rhythmVariation)
      
      // Dynamic velocity based on position and style
      let velocity = 0.7
      if (style === 'classical') {
        velocity = 0.6 + Math.sin(i / length * Math.PI) * 0.3
      } else if (style === 'jazz') {
        velocity = 0.5 + Math.random() * 0.4
      }
      velocities.push(velocity)
      
      // Calculate interval for harmonic analysis
      if (i > 0) {
        const prevNoteNum = this.noteToNumber(notes[i - 1])
        const currNoteNum = this.noteToNumber(currentNote)
        intervals.push(currNoteNum - prevNoteNum)
      } else {
        intervals.push(0)
      }
    }
    
    logger.info(`Generated ${style} melody with ${length} notes`)
    
    return { notes, durations, velocities, intervals }
  }
  
  generateChordProgression(options: {
    length?: number
    style?: keyof typeof musicTheory.progressions
    scale?: number[]
    rootNote?: string
  } = {}): ChordProgression {
    const {
      length = 4,
      style = 'pop',
      scale = scales.major,
      rootNote = 'C'
    } = options
    
    const progression = musicTheory.progressions[style]
    const chords: string[][] = []
    const functions: ChordProgression['functions'] = []
    const durations: number[] = []
    
    for (let i = 0; i < length; i++) {
      const chordFunction = progression[i % progression.length] as ChordProgression['functions'][0]
      const chord = musicTheory.getChord(chordFunction, scale, rootNote)
      
      chords.push(chord)
      functions.push(chordFunction)
      durations.push(1.0) // Each chord lasts 1 beat
    }
    
    logger.info(`Generated ${style} chord progression: ${functions.join(' - ')}`)
    
    return { chords, durations, functions }
  }
  
  private noteToNumber(note: string): number {
    const noteMap: Record<string, number> = {
      'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
    }
    const noteName = note.charAt(0)
    const octave = parseInt(note.slice(-1)) || 4
    return noteMap[noteName] + (octave * 12)
  }
  
  harmonizeMelody(melody: MelodyPattern, style: keyof typeof musicTheory.progressions = 'pop'): ChordProgression {
    // Analyze melody to suggest chord progression
    const chordLength = Math.ceil(melody.notes.length / 4)
    return this.generateChordProgression({ length: chordLength, style })
  }
  
  // Generate variations of an existing melody
  generateVariation(originalMelody: MelodyPattern, variationType: 'rhythmic' | 'melodic' | 'harmonic' = 'melodic'): MelodyPattern {
    const { notes, durations, velocities, intervals } = originalMelody
    
    if (variationType === 'rhythmic') {
      // Vary only rhythm and velocity
      const newDurations = durations.map(d => d * (0.8 + Math.random() * 0.4))
      const newVelocities = velocities.map(v => Math.min(1, Math.max(0.1, v + (Math.random() - 0.5) * 0.3)))
      return { notes, durations: newDurations, velocities: newVelocities, intervals }
    } else if (variationType === 'melodic') {
      // Vary melody while keeping rhythm
      const newNotes = notes.map((note, i) => {
        if (Math.random() < 0.3) { // 30% chance to change each note
          const noteNum = this.noteToNumber(note)
          const variation = Math.floor((Math.random() - 0.5) * 4) // ±2 semitones
          return this.numberToNote(noteNum + variation)
        }
        return note
      })
      
      const newIntervals = newNotes.map((note, i) => {
        if (i === 0) return 0
        return this.noteToNumber(note) - this.noteToNumber(newNotes[i - 1])
      })
      
      return { notes: newNotes, durations, velocities, intervals: newIntervals }
    }
    
    // harmonic variation - add ornaments and grace notes
    const ornamentedNotes: string[] = []
    const ornamentedDurations: number[] = []
    const ornamentedVelocities: number[] = []
    
    notes.forEach((note, i) => {
      if (Math.random() < 0.2 && durations[i] >= 0.5) {
        // Add grace note
        const noteNum = this.noteToNumber(note)
        const graceNote = this.numberToNote(noteNum + (Math.random() < 0.5 ? 1 : -1))
        
        ornamentedNotes.push(graceNote, note)
        ornamentedDurations.push(durations[i] * 0.1, durations[i] * 0.9)
        ornamentedVelocities.push(velocities[i] * 0.7, velocities[i])
      } else {
        ornamentedNotes.push(note)
        ornamentedDurations.push(durations[i])
        ornamentedVelocities.push(velocities[i])
      }
    })
    
    const newIntervals = ornamentedNotes.map((note, i) => {
      if (i === 0) return 0
      return this.noteToNumber(note) - this.noteToNumber(ornamentedNotes[i - 1])
    })
    
    return {
      notes: ornamentedNotes,
      durations: ornamentedDurations,
      velocities: ornamentedVelocities,
      intervals: newIntervals
    }
  }
  
  private numberToNote(noteNumber: number): string {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const octave = Math.floor(noteNumber / 12)
    const noteIndex = noteNumber % 12
    return noteNames[noteIndex] + octave
  }
}

// Global AI composer instance
export const aiComposer = new AIComposer()

// Enhanced melody generation function for integration with existing system
export async function generateEnhancedMelody(options?: {
  style?: 'classical' | 'jazz' | 'pop' | 'ambient'
  complexity?: 'simple' | 'moderate' | 'complex'
  length?: number
  withHarmony?: boolean
}) {
  const melody = aiComposer.generateMelody(options)
  
  const result = {
    notes: melody.notes.map((note, i) => ({
      note,
      time: melody.durations.slice(0, i).reduce((sum, dur) => sum + dur, 0),
      duration: melody.durations[i],
      velocity: melody.velocities[i]
    }))
  }
  
  if (options?.withHarmony) {
    const harmony = aiComposer.harmonizeMelody(melody, options.style === 'jazz' ? 'jazz' : 'pop')
    return { ...result, harmony }
  }
  
  return result
}
