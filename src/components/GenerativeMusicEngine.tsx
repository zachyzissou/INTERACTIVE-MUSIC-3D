'use client'
// src/components/GenerativeMusicEngine.tsx
// AI-powered generative music system
import React, { useRef, useState, useEffect } from 'react'
import { useAudioSettings } from '../store/useAudioSettings'
import { playNote, isAudioInitialized } from '../lib/audio'

interface GenerativePattern {
  id: string
  name: string
  description: string
  algorithm: 'markov' | 'cellular' | 'neural' | 'fractal'
  parameters: Record<string, number>
}

interface GenerativeMusicEngineProps {
  isPlaying: boolean
  pattern?: GenerativePattern
  onPatternChange?: (pattern: GenerativePattern) => void
}

// Predefined generative patterns
const GENERATIVE_PATTERNS: GenerativePattern[] = [
  {
    id: 'ambient-drift',
    name: 'Ambient Drift',
    description: 'Slow evolving ambient textures using cellular automata',
    algorithm: 'cellular',
    parameters: { tempo: 0.3, complexity: 0.4, harmony: 0.7 }
  },
  {
    id: 'fractal-melody',
    name: 'Fractal Melody',
    description: 'Self-similar melodic patterns based on mathematical fractals',
    algorithm: 'fractal',
    parameters: { tempo: 0.6, complexity: 0.6, harmony: 0.5 }
  },
  {
    id: 'markov-improv',
    name: 'Markov Improvisation',
    description: 'Jazz-influenced improvisation using Markov chains',
    algorithm: 'markov',
    parameters: { tempo: 0.8, complexity: 0.7, harmony: 0.8 }
  },
  {
    id: 'neural-dream',
    name: 'Neural Dream',
    description: 'AI-generated soundscapes inspired by neural networks',
    algorithm: 'neural',
    parameters: { tempo: 0.5, complexity: 0.9, harmony: 0.6 }
  }
]

class GenerativeEngine {
  private pattern: GenerativePattern
  private state: number[]
  private history: string[]
  private time: number

  constructor(pattern: GenerativePattern) {
    this.pattern = pattern
    this.state = Array(16).fill(0).map(() => Math.random())
    this.history = []
    this.time = 0
  }

  // Markov chain-based generation
  generateMarkovNote(): string {
    const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']
    const transitions: Record<string, string[]> = {
      'C4': ['D4', 'E4', 'F4', 'G4'],
      'D4': ['C4', 'E4', 'F4', 'A4'],
      'E4': ['D4', 'F4', 'G4', 'C4'],
      'F4': ['E4', 'G4', 'A4', 'D4'],
      'G4': ['F4', 'A4', 'B4', 'E4'],
      'A4': ['G4', 'B4', 'C5', 'F4'],
      'B4': ['A4', 'C5', 'G4'],
      'C5': ['B4', 'A4', 'G4']
    }

    const lastNote = this.history[this.history.length - 1] || 'C4'
    const possibilities = transitions[lastNote] || ['C4']
    const nextNote = possibilities[Math.floor(Math.random() * possibilities.length)]
    
    this.history.push(nextNote)
    if (this.history.length > 10) this.history.shift()
    
    return nextNote
  }

  // Cellular automata-based generation
  generateCellularPattern(): string[] {
    const { complexity } = this.pattern.parameters
    
    // Update cellular automata state
    const newState = [...this.state]
    for (let i = 1; i < this.state.length - 1; i++) {
      const neighbors = this.state[i-1] + this.state[i] + this.state[i+1]
      // Rule: if neighbors sum > threshold, cell becomes active
      newState[i] = neighbors > (2 - complexity) ? 1 : Math.max(0, this.state[i] - 0.1)
    }
    this.state = newState

    // Convert state to notes
    const notes: string[] = []
    const scale = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']
    
    for (let i = 0; i < this.state.length; i++) {
      if (this.state[i] > 0.5) {
        notes.push(scale[i % scale.length])
      }
    }

    return notes
  }

  // Fractal-based generation
  generateFractalMelody(): string {
    const { harmony, complexity } = this.pattern.parameters
    
    // Simple fractal sequence (Fibonacci-like)
    const sequence = [1, 1]
    for (let i = 2; i < 8; i++) {
      sequence[i] = (sequence[i-1] + sequence[i-2]) % 12
    }

    // Map to musical scale
    const scale = ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4']
    const index = Math.floor(this.time * complexity) % sequence.length
    const noteIndex = Math.floor(sequence[index] * harmony) % scale.length
    
    return scale[noteIndex]
  }

  // Neural network-inspired generation
  generateNeuralPattern(): string[] {
    const { complexity, harmony } = this.pattern.parameters
    
    // Simulate neural network layers
    let activation = Math.sin(this.time * 0.1) * complexity
    activation = Math.tanh(activation + Math.random() * 0.2 - 0.1)
    
    const notes: string[] = []
    const chordBase = ['C4', 'E4', 'G4', 'B4']
    
    // Generate harmonically rich patterns
    if (Math.abs(activation) > 0.3) {
      const numNotes = Math.floor(Math.abs(activation) * 4 * harmony) + 1
      for (let i = 0; i < numNotes; i++) {
        notes.push(chordBase[i % chordBase.length])
      }
    }

    return notes
  }

  step(): { notes: string[], chords: string[][] } {
    this.time += 1
    const { algorithm } = this.pattern

    let notes: string[] = []
    let chords: string[][] = []

    switch (algorithm) {
      case 'markov':
        notes = [this.generateMarkovNote()]
        break
        
      case 'cellular':
        notes = this.generateCellularPattern()
        break
        
      case 'fractal':
        notes = [this.generateFractalMelody()]
        break
        
      case 'neural':
        const neuralNotes = this.generateNeuralPattern()
        if (neuralNotes.length > 1) {
          chords = [neuralNotes]
        } else {
          notes = neuralNotes
        }
        break
    }

    return { notes, chords }
  }
}

export default function GenerativeMusicEngine({ 
  isPlaying, 
  pattern = GENERATIVE_PATTERNS[0],
  onPatternChange 
}: Readonly<GenerativeMusicEngineProps>) {
  const engineRef = useRef<GenerativeEngine | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [currentPattern, setCurrentPattern] = useState(pattern)
  const { bpm } = useAudioSettings()

  // Initialize engine when pattern changes
  useEffect(() => {
    engineRef.current = new GenerativeEngine(currentPattern)
  }, [currentPattern])

  // Start/stop generation based on isPlaying
  useEffect(() => {
    if (isPlaying && isAudioInitialized() && engineRef.current) {
      const interval = 60000 / (bpm * currentPattern.parameters.tempo)
      
      intervalRef.current = setInterval(() => {
        if (!engineRef.current) return
        
        const { notes, chords } = engineRef.current.step()
        
        // Play generated notes
        notes.forEach((note, index) => {
          setTimeout(() => playNote(note), index * 50)
        })
        
        // Play generated chords
        chords.forEach((chord, index) => {
          setTimeout(() => {
            chord.forEach((note, noteIndex) => {
              setTimeout(() => playNote(note), noteIndex * 20)
            })
          }, index * 100)
        })
      }, interval)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, currentPattern, bpm])

  const handlePatternChange = (newPattern: GenerativePattern) => {
    setCurrentPattern(newPattern)
    onPatternChange?.(newPattern)
  }

  return (
    <div className="generative-music-engine p-4 bg-black/30 rounded-lg backdrop-blur-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">🎼 Generative Music</h3>
        <p className="text-sm text-gray-300">{currentPattern.description}</p>
      </div>

      <div className="pattern-selector mb-4">
        <label htmlFor="pattern-select" className="block text-sm text-gray-300 mb-2">Pattern:</label>
        <select
          id="pattern-select"
          title="Select generative music pattern"
          value={currentPattern.id}
          onChange={(e) => {
            const selected = GENERATIVE_PATTERNS.find(p => p.id === e.target.value)
            if (selected) handlePatternChange(selected)
          }}
          className="w-full p-2 bg-gray-800 text-white rounded border border-gray-600"
        >
          {GENERATIVE_PATTERNS.map(pattern => (
            <option key={pattern.id} value={pattern.id}>
              {pattern.name}
            </option>
          ))}
        </select>
      </div>

      <div className="parameters space-y-3">
        <div>
          <label htmlFor="tempo-slider" className="block text-xs text-gray-400 mb-1">
            Tempo: {currentPattern.parameters.tempo.toFixed(2)}
          </label>
          <input
            id="tempo-slider"
            title="Adjust tempo"
            type="range"
            min="0.1"
            max="2"
            step="0.1"
            value={currentPattern.parameters.tempo}
            onChange={(e) => {
              const newPattern = {
                ...currentPattern,
                parameters: {
                  ...currentPattern.parameters,
                  tempo: parseFloat(e.target.value)
                }
              }
              handlePatternChange(newPattern)
            }}
            className="w-full"
          />
        </div>

        <div>
          <label htmlFor="complexity-slider" className="block text-xs text-gray-400 mb-1">
            Complexity: {currentPattern.parameters.complexity.toFixed(2)}
          </label>
          <input
            id="complexity-slider"
            title="Adjust complexity"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={currentPattern.parameters.complexity}
            onChange={(e) => {
              const newPattern = {
                ...currentPattern,
                parameters: {
                  ...currentPattern.parameters,
                  complexity: parseFloat(e.target.value)
                }
              }
              handlePatternChange(newPattern)
            }}
            className="w-full"
          />
        </div>

        <div>
          <label htmlFor="harmony-slider" className="block text-xs text-gray-400 mb-1">
            Harmony: {currentPattern.parameters.harmony.toFixed(2)}
          </label>
          <input
            id="harmony-slider"
            title="Adjust harmony"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={currentPattern.parameters.harmony}
            onChange={(e) => {
              const newPattern = {
                ...currentPattern,
                parameters: {
                  ...currentPattern.parameters,
                  harmony: parseFloat(e.target.value)
                }
              }
              handlePatternChange(newPattern)
            }}
            className="w-full"
          />
        </div>
      </div>

      <div className="status mt-4 p-2 bg-gray-800/50 rounded text-xs text-gray-400">
        Status: {isPlaying ? '🎵 Generating' : '⏸️ Paused'} | 
        Algorithm: {currentPattern.algorithm.toUpperCase()} |
        BPM: {bpm}
      </div>
    </div>
  )
}
