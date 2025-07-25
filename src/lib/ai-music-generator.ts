/**
 * Advanced AI-Powered Music Generation System
 * Uses machine learning models for intelligent composition and real-time generation
 */

import * as Tone from 'tone'
import { logger } from './logger'

// Types for AI music generation
export interface AIMusicalPhrase {
  notes: Array<{
    pitch: number
    velocity: number
    startTime: number
    endTime: number
    duration: number
  }>
  key: string
  scale: string
  tempo: number
  timeSignature: [number, number]
  style: 'classical' | 'jazz' | 'electronic' | 'ambient' | 'experimental'
}

export interface AIGenerationConfig {
  seedSequence?: number[]
  temperature: number // 0.1 (conservative) to 2.0 (creative)
  steps: number // number of notes to generate
  keySignature: string
  scaleType: 'major' | 'minor' | 'dorian' | 'mixolydian' | 'pentatonic' | 'blues'
  style: AIMusicalPhrase['style']
  rhythmComplexity: number // 0.0 to 1.0
  harmonicComplexity: number // 0.0 to 1.0
  audioAnalysis?: {
    bass: number
    mid: number
    treble: number
    energy: number
  }
}

export interface AIModel {
  name: string
  type: 'melody' | 'harmony' | 'rhythm' | 'texture'
  loaded: boolean
  generate(config: AIGenerationConfig): Promise<AIMusicalPhrase>
}

// Scale definitions for AI generation
const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  pentatonic: [0, 2, 4, 7, 9],
  blues: [0, 3, 5, 6, 7, 10]
}

// Chord progressions for different styles
const CHORD_PROGRESSIONS = {
  classical: [[0, 2, 4], [3, 5, 0], [1, 3, 5], [0, 2, 4]],
  jazz: [[0, 2, 4, 6], [1, 3, 5, 0], [4, 6, 1, 3], [0, 2, 4, 6]],
  electronic: [[0, 4], [5, 2], [3, 0], [4, 5]],
  ambient: [[0, 2, 4, 7], [2, 4, 7, 9], [4, 7, 9, 0], [7, 9, 0, 2]],
  experimental: [[0, 1, 5], [2, 6, 10], [3, 7, 11], [4, 8, 0]]
}

class MelodyGeneratorModel implements AIModel {
  name = 'MelodyGenerator'
  type: 'melody' = 'melody'
  loaded = true

  private markovChain: Map<string, number[]> = new Map()
  private rhythmPatterns: number[][] = [
    [1, 0, 0.5, 0, 1, 0, 0.5, 0], // Standard 4/4
    [1, 0, 0, 0.5, 0, 0, 1, 0], // Syncopated
    [1, 0.5, 0, 1, 0, 0.5, 0, 0], // Dotted rhythms
    [1, 0, 1, 0, 1, 0, 1, 0], // Straight eighths
    [1, 0, 0, 1, 0, 0, 1, 0.5] // Complex pattern
  ]

  constructor() {
    this.buildMarkovChain()
  }

  private buildMarkovChain() {
    // Build Markov chain from common melodic patterns
    const patterns = [
      [0, 2, 4, 2, 0], // C-D-E-D-C
      [0, 4, 7, 4, 0], // C-E-G-E-C
      [7, 5, 4, 2, 0], // G-F-E-D-C (descending)
      [0, 2, 4, 5, 7], // C-D-E-F-G (ascending)
      [4, 2, 0, 7, 9], // E-D-C-G-A (mixed)
      [0, 7, 4, 5, 2], // Arpeggiated pattern
      [2, 4, 7, 9, 7, 4, 2, 0] // Extended melodic phrase
    ]

    patterns.forEach(pattern => {
      for (let i = 0; i < pattern.length - 1; i++) {
        const current = pattern[i].toString()
        const next = pattern[i + 1]
        
        if (!this.markovChain.has(current)) {
          this.markovChain.set(current, [])
        }
        this.markovChain.get(current)!.push(next)
      }
    })
  }

  async generate(config: AIGenerationConfig): Promise<AIMusicalPhrase> {
    const scale = SCALES[config.scaleType]
    const notes: AIMusicalPhrase['notes'] = []
    const rhythmPattern = this.rhythmPatterns[Math.floor(Math.random() * this.rhythmPatterns.length)]
    
    let currentNote = config.seedSequence?.[0] ?? 0
    let currentTime = 0
    const baseNoteLength = 0.5 // eighth note

    // Audio-reactive parameters
    const energyMultiplier = config.audioAnalysis ? (config.audioAnalysis.energy * 0.5 + 0.5) : 1
    const bassInfluence = config.audioAnalysis ? config.audioAnalysis.bass / 255 : 0.5
    const trebleInfluence = config.audioAnalysis ? config.audioAnalysis.treble / 255 : 0.5

    for (let i = 0; i < config.steps; i++) {
      const rhythmIndex = i % rhythmPattern.length
      const rhythmValue = rhythmPattern[rhythmIndex] * energyMultiplier
      
      if (rhythmValue > 0) {
        // Apply temperature-based randomness
        let nextNote = currentNote
        
        if (Math.random() < config.temperature) {
          // Markov chain-based generation
          const possibleNext = this.markovChain.get(currentNote.toString()) || [0, 2, 4]
          nextNote = possibleNext[Math.floor(Math.random() * possibleNext.length)]
        } else {
          // Stepwise motion (more conservative)
          const direction = Math.random() > 0.5 ? 1 : -1
          nextNote = Math.max(0, Math.min(scale.length - 1, currentNote + direction))
        }

        // Apply harmonic complexity
        if (Math.random() < config.harmonicComplexity) {
          nextNote = (nextNote + Math.floor(Math.random() * 3) - 1) % scale.length
        }

        // Audio-reactive pitch modification
        const pitchOffset = Math.floor((bassInfluence - 0.5) * 4) // -2 to +2 semitones
        const basePitch = 60 + scale[nextNote] + pitchOffset // Middle C + scale degree

        // Audio-reactive velocity
        const velocity = Math.max(0.3, Math.min(1.0, rhythmValue * (0.5 + trebleInfluence * 0.5)))
        
        const duration = baseNoteLength * (rhythmValue * 2)
        
        notes.push({
          pitch: basePitch,
          velocity,
          startTime: currentTime,
          endTime: currentTime + duration,
          duration
        })

        currentNote = nextNote
      }
      
      currentTime += baseNoteLength
    }

    return {
      notes,
      key: config.keySignature,
      scale: config.scaleType,
      tempo: 120,
      timeSignature: [4, 4],
      style: config.style
    }
  }
}

class HarmonyGeneratorModel implements AIModel {
  name = 'HarmonyGenerator'
  type: 'harmony' = 'harmony'
  loaded = true

  async generate(config: AIGenerationConfig): Promise<AIMusicalPhrase> {
    const scale = SCALES[config.scaleType]
    const progression = CHORD_PROGRESSIONS[config.style] || CHORD_PROGRESSIONS.classical
    const notes: AIMusicalPhrase['notes'] = []
    
    let currentTime = 0
    const chordDuration = 2.0 // 2 beats per chord
    
    // Audio-reactive parameters
    const energyLevel = config.audioAnalysis ? config.audioAnalysis.energy : 0.5
    const bassLevel = config.audioAnalysis ? config.audioAnalysis.bass / 255 : 0.5

    progression.forEach((chord, chordIndex) => {
      chord.forEach((degree, noteIndex) => {
        const scaleDegree = degree % scale.length
        const octave = Math.floor(degree / scale.length)
        const basePitch = 48 + scale[scaleDegree] + (octave * 12) // Lower octave for harmony
        
        // Audio-reactive voicing
        const voicing = bassLevel > 0.7 ? 0 : (bassLevel > 0.3 ? 1 : 2) // Spread based on bass
        const pitch = basePitch + voicing * 12
        
        // Temperature-based timing variation
        const timeOffset = (Math.random() - 0.5) * config.temperature * 0.1
        const startTime = currentTime + timeOffset
        
        // Audio-reactive velocity
        const baseVelocity = 0.4 + (energyLevel * 0.3)
        const velocity = Math.max(0.2, Math.min(0.8, baseVelocity * (1 - noteIndex * 0.1)))
        
        notes.push({
          pitch,
          velocity,
          startTime,
          endTime: startTime + chordDuration * 0.9, // Slight gap between chords
          duration: chordDuration * 0.9
        })
      })
      
      currentTime += chordDuration
    })

    return {
      notes,
      key: config.keySignature,
      scale: config.scaleType,
      tempo: 120,
      timeSignature: [4, 4],
      style: config.style
    }
  }
}

class RhythmGeneratorModel implements AIModel {
  name = 'RhythmGenerator'
  type: 'rhythm' = 'rhythm'
  loaded = true

  private patterns = {
    classical: [
      [1, 0, 0.5, 0, 1, 0, 0.5, 0],
      [1, 0, 1, 0, 1, 0, 1, 0]
    ],
    jazz: [
      [1, 0, 0, 0.7, 0, 0.5, 0, 0.3],
      [0.8, 0.3, 0, 1, 0, 0.6, 0.4, 0]
    ],
    electronic: [
      [1, 0, 0, 0, 1, 0, 0, 0],
      [1, 0, 1, 0, 0.8, 0, 1, 0]
    ],
    ambient: [
      [1, 0, 0, 0, 0, 0, 0.5, 0],
      [0.6, 0, 0, 0, 0.4, 0, 0, 0]
    ],
    experimental: [
      [1, 0.3, 0, 0.7, 0.2, 1, 0, 0.5],
      [0.9, 0, 0.4, 0, 0.8, 0.2, 0.6, 0]
    ]
  }

  async generate(config: AIGenerationConfig): Promise<AIMusicalPhrase> {
    const stylePatterns = this.patterns[config.style] || this.patterns.electronic
    const basePattern = stylePatterns[Math.floor(Math.random() * stylePatterns.length)]
    const notes: AIMusicalPhrase['notes'] = []
    
    let currentTime = 0
    const beatDuration = 0.25 // Sixteenth note
    
    // Audio-reactive parameters
    const bassLevel = config.audioAnalysis ? config.audioAnalysis.bass / 255 : 0.5
    const midLevel = config.audioAnalysis ? config.audioAnalysis.mid / 255 : 0.5
    
    // Generate rhythm pattern with variations
    for (let bar = 0; bar < Math.ceil(config.steps / 16); bar++) {
      basePattern.forEach((intensity, beatIndex) => {
        if (intensity > 0) {
          // Apply rhythm complexity
          const complexityFactor = Math.random() < config.rhythmComplexity ? 
            Math.random() * 0.5 + 0.5 : 1.0
          
          // Audio-reactive intensity
          const audioIntensity = intensity * (0.7 + bassLevel * 0.3)
          const finalIntensity = audioIntensity * complexityFactor
          
          if (finalIntensity > 0.1) {
            // Pitch varies based on beat position and audio
            const basePitch = 36 // Low C for kick-like sounds
            const pitchVariation = Math.floor(midLevel * 12) // Up to an octave variation
            
            notes.push({
              pitch: basePitch + pitchVariation,
              velocity: Math.max(0.3, Math.min(1.0, finalIntensity)),
              startTime: currentTime,
              endTime: currentTime + beatDuration * 0.8,
              duration: beatDuration * 0.8
            })
          }
        }
        
        currentTime += beatDuration
      })
    }

    return {
      notes,
      key: config.keySignature,
      scale: config.scaleType,
      tempo: 120,
      timeSignature: [4, 4],
      style: config.style
    }
  }
}

class TextureGeneratorModel implements AIModel {
  name = 'TextureGenerator'
  type: 'texture' = 'texture'
  loaded = true

  async generate(config: AIGenerationConfig): Promise<AIMusicalPhrase> {
    const notes: AIMusicalPhrase['notes'] = []
    const scale = SCALES[config.scaleType]
    
    // Audio-reactive parameters
    const audioAnalysis = config.audioAnalysis
    const trebleLevel = audioAnalysis ? audioAnalysis.treble / 255 : 0.5
    const midLevel = audioAnalysis ? audioAnalysis.mid / 255 : 0.5
    const energy = audioAnalysis ? audioAnalysis.energy : 0.5

    // Generate atmospheric texture based on style and audio
    const textureLength = config.steps * 0.125 // Longer notes for texture
    const layerCount = Math.ceil(energy * 4) + 2 // 2-6 layers based on energy
    
    for (let layer = 0; layer < layerCount; layer++) {
      const layerOffset = layer * (textureLength / layerCount)
      const scaleDegree = Math.floor(Math.random() * scale.length)
      const octave = Math.floor(Math.random() * 3) + 4 // Octaves 4-6
      const basePitch = scale[scaleDegree] + (octave * 12)
      
      // Style-specific pitch modifications
      let pitch = basePitch
      switch (config.style) {
        case 'ambient':
          pitch += Math.random() * 24 - 12 // Wide pitch range
          break
        case 'experimental':
          pitch += Math.floor(Math.random() * 7) - 3 // Microtonal-ish
          break
        case 'classical':
          pitch += [0, 4, 7][Math.floor(Math.random() * 3)] // Triadic
          break
      }
      
      // Audio-reactive parameters
      const velocity = Math.max(0.1, Math.min(0.6, 
        0.2 + (trebleLevel * 0.3) + (midLevel * 0.1)
      ))
      
      const startTime = layerOffset + (Math.random() - 0.5) * config.temperature
      const duration = textureLength * (0.8 + Math.random() * 0.4) // Varying lengths
      
      notes.push({
        pitch: Math.max(24, Math.min(96, pitch)), // Clamp to reasonable range
        velocity,
        startTime: Math.max(0, startTime),
        endTime: startTime + duration,
        duration
      })
    }

    return {
      notes,
      key: config.keySignature,
      scale: config.scaleType,
      tempo: 120,
      timeSignature: [4, 4],
      style: config.style
    }
  }
}

export class AIMusicGenerator {
  private models: Map<string, AIModel> = new Map()
  private isInitialized = false

  constructor() {
    // Initialize AI models
    this.models.set('melody', new MelodyGeneratorModel())
    this.models.set('harmony', new HarmonyGeneratorModel())
    this.models.set('rhythm', new RhythmGeneratorModel())
    this.models.set('texture', new TextureGeneratorModel())
  }

  async initialize(): Promise<boolean> {
    try {
      // All models are synchronous for now
      this.isInitialized = true
      logger.info('AI Music Generator initialized successfully')
      return true
    } catch (error) {
      logger.error('Failed to initialize AI Music Generator: ' + String(error))
      return false
    }
  }

  async generatePhrase(
    type: 'melody' | 'harmony' | 'rhythm' | 'texture',
    config: AIGenerationConfig
  ): Promise<AIMusicalPhrase | null> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    const model = this.models.get(type)
    if (!model || !model.loaded) {
      logger.warn(`AI model '${type}' not available`)
      return null
    }

    try {
      const phrase = await model.generate(config)
      logger.debug(`Generated ${type} phrase with ${phrase.notes.length} notes`)
      return phrase
    } catch (error) {
      logger.error(`Failed to generate ${type}: ${String(error)}`)
      return null
    }
  }

  async generateComposition(config: AIGenerationConfig): Promise<{
    melody: AIMusicalPhrase | null
    harmony: AIMusicalPhrase | null  
    rhythm: AIMusicalPhrase | null
    texture: AIMusicalPhrase | null
  }> {
    const [melody, harmony, rhythm, texture] = await Promise.all([
      this.generatePhrase('melody', config),
      this.generatePhrase('harmony', config),
      this.generatePhrase('rhythm', config),
      this.generatePhrase('texture', config)
    ])

    return { melody, harmony, rhythm, texture }
  }

  async playPhrase(phrase: AIMusicalPhrase, synthType: 'melody' | 'harmony' | 'rhythm' | 'texture') {
    if (!phrase.notes.length) return

    // Create appropriate synth for the phrase type
    let synth: Tone.ToneAudioNode
    
    switch (synthType) {
      case 'melody':
        synth = new Tone.Synth({
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.02, decay: 0.2, sustain: 0.3, release: 0.8 }
        }).toDestination()
        break
        
      case 'harmony':
        synth = new Tone.PolySynth({
          voice: Tone.Synth,
          options: {
            oscillator: { type: 'sine' },
            envelope: { attack: 0.1, decay: 0.3, sustain: 0.4, release: 1.2 }
          }
        }).toDestination()
        break
        
      case 'rhythm':
        synth = new Tone.MembraneSynth({
          pitchDecay: 0.05,
          octaves: 6,
          oscillator: { type: 'sine' },
          envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
        }).toDestination()
        break
        
      case 'texture':
        synth = new Tone.Synth({
          oscillator: { type: 'sawtooth' },
          envelope: { attack: 0.5, decay: 1.0, sustain: 0.8, release: 2.0 },
          filter: { frequency: 1000, Q: 2 }
        }).toDestination()
        break
    }

    // Schedule all notes
    const now = Tone.now()
    phrase.notes.forEach(note => {
      const frequency = Tone.Frequency(note.pitch, 'midi').toFrequency()
      const startTime = now + note.startTime
      
      if (synth instanceof Tone.PolySynth) {
        synth.triggerAttackRelease(frequency, note.duration, startTime, note.velocity)
      } else if (synth instanceof Tone.Synth || synth instanceof Tone.MembraneSynth) {
        (synth as any).triggerAttackRelease(frequency, note.duration, startTime, note.velocity)
      }
    })

    // Auto-dispose synth after playback
    setTimeout(() => {
      synth.dispose()
    }, (phrase.notes[phrase.notes.length - 1]?.endTime || 4) * 1000 + 2000)
  }

  getModelStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {}
    this.models.forEach((model, key) => {
      status[key] = model.loaded
    })
    return status
  }

  dispose() {
    this.models.clear()
    this.isInitialized = false
  }
}