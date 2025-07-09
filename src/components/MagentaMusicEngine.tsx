'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Sequence } from '@magenta/music/es5'
import * as mm from '@magenta/music/es5'
import { gsap } from 'gsap'

interface MagentaMusicEngineProps {
  audioContext: AudioContext | null
  isPlaying: boolean
  onSequenceGenerated: (sequence: Sequence) => void
  audioData: {
    bass: number
    mid: number
    high: number
    volume: number
  }
}

interface GenerationConfig {
  temperature: number
  stepsPerQuarter: number
  qpm: number
  totalSteps: number
  minPitch: number
  maxPitch: number
}

const MagentaMusicEngine: React.FC<MagentaMusicEngineProps> = ({
  audioContext,
  isPlaying,
  onSequenceGenerated,
  audioData
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [models, setModels] = useState<{
    melody: any
    drums: any
    chords: any
  }>({
    melody: null,
    drums: null,
    chords: null
  })
  const [config, setConfig] = useState<GenerationConfig>({
    temperature: 1.0,
    stepsPerQuarter: 4,
    qpm: 120,
    totalSteps: 32,
    minPitch: 60,
    maxPitch: 84
  })
  
  const containerRef = useRef<HTMLDivElement>(null)
  const generationCountRef = useRef(0)

  // Initialize Magenta models
  useEffect(() => {
    const initializeModels = async () => {
      if (!audioContext) return
      
      setIsLoading(true)
      
      try {
        // Initialize MelodyRNN model
        const melodyModel = new mm.MelodyRNN(
          'https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/basic_rnn'
        )
        
        // Initialize DrumsRNN model  
        const drumsModel = new mm.DrumsRNN(
          'https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/drum_kit_rnn'
        )
        
        // Initialize chord progression model (using Piano Genie for simplicity)
        const chordsModel = new mm.PianoGenie(
          'https://storage.googleapis.com/magentadata/js/checkpoints/piano_genie/model'
        )
        
        await Promise.all([
          melodyModel.initialize(),
          drumsModel.initialize(), 
          chordsModel.initialize()
        ])
        
        setModels({
          melody: melodyModel,
          drums: drumsModel,
          chords: chordsModel
        })
        
        console.log('✅ Magenta models initialized successfully')
      } catch (error) {
        console.warn('⚠️ Failed to initialize Magenta models:', error)
        // Fallback to algorithmic generation
        setModels({
          melody: null,
          drums: null,
          chords: null
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    initializeModels()
  }, [audioContext])

  // Audio-reactive configuration updates
  useEffect(() => {
    const bassInfluence = audioData.bass
    const midInfluence = audioData.mid
    const highInfluence = audioData.high
    
    // Update generation parameters based on audio
    setConfig(prev => ({
      ...prev,
      temperature: Math.max(0.1, Math.min(2.0, 0.8 + bassInfluence * 0.6)),
      qpm: Math.floor(100 + midInfluence * 60), // 100-160 BPM
      totalSteps: 16 + Math.floor(highInfluence * 48) // 16-64 steps
    }))
  }, [audioData.bass, audioData.mid, audioData.high])

  // Generate algorithmic fallback sequence
  const generateAlgorithmicSequence = useCallback((): Sequence => {
    const sequence: Sequence = {
      notes: [],
      totalTime: (config.totalSteps / config.stepsPerQuarter) * (60 / config.qpm)
    }
    
    const stepDuration = 60 / (config.qpm * config.stepsPerQuarter)
    const scaleNotes = [60, 62, 64, 65, 67, 69, 71, 72] // C Major scale
    
    for (let step = 0; step < config.totalSteps; step++) {
      const shouldPlayNote = Math.random() < (0.3 + audioData.bass * 0.4)
      
      if (shouldPlayNote) {
        const noteIndex = Math.floor(Math.random() * scaleNotes.length)
        const pitch = scaleNotes[noteIndex] + Math.floor(audioData.high * 12)
        const velocity = Math.floor(60 + audioData.mid * 67)
        
        sequence.notes.push({
          pitch: Math.max(config.minPitch, Math.min(config.maxPitch, pitch)),
          startTime: step * stepDuration,
          endTime: (step + 1) * stepDuration,
          velocity
        })
      }
    }
    
    return sequence
  }, [config, audioData])

  // Generate music with Magenta or fallback
  const generateMusic = useCallback(async () => {
    if (isLoading) return
    
    setIsLoading(true)
    generationCountRef.current++
    
    // Animate generation UI
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        scale: 1.05,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut"
      })
    }
    
    try {
      let sequence: Sequence
      
      if (models.melody) {
        // Use Magenta MelodyRNN
        const seedSequence: Sequence = {
          notes: [
            { pitch: 60, startTime: 0, endTime: 0.5, velocity: 80 },
            { pitch: 64, startTime: 0.5, endTime: 1.0, velocity: 80 }
          ],
          totalTime: 1.0
        }
        
        sequence = await models.melody.continueSequence(
          seedSequence,
          config.totalSteps,
          config.temperature
        )
      } else {
        // Use algorithmic fallback
        sequence = generateAlgorithmicSequence()
      }
      
      // Add audio-reactive modifications
      sequence.notes = sequence.notes.map(note => ({
        ...note,
        velocity: Math.floor(note.velocity * (0.7 + audioData.volume * 0.6)),
        pitch: note.pitch + Math.floor(audioData.high * 4 - 2) // Slight pitch variation
      }))
      
      onSequenceGenerated(sequence)
      
      console.log(`🎵 Generated sequence #${generationCountRef.current} with ${sequence.notes.length} notes`)
      
    } catch (error) {
      console.error('Failed to generate music:', error)
      
      // Always provide fallback
      const fallbackSequence = generateAlgorithmicSequence()
      onSequenceGenerated(fallbackSequence)
    } finally {
      setIsLoading(false)
    }
  }, [models, config, audioData, onSequenceGenerated, generateAlgorithmicSequence, isLoading])

  // Auto-generate based on audio energy
  useEffect(() => {
    const totalEnergy = audioData.bass + audioData.mid + audioData.high
    
    if (isPlaying && totalEnergy > 1.5 && !isLoading) {
      const shouldGenerate = Math.random() < 0.1 // 10% chance per frame when energy is high
      
      if (shouldGenerate) {
        generateMusic()
      }
    }
  }, [audioData, isPlaying, generateMusic, isLoading])

  return (
    <div 
      ref={containerRef}
      className="magenta-music-engine p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-xl border border-purple-500/30"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <span className="mr-2">🧠</span>
          AI Music Engine
          {isLoading && (
            <div className="ml-2 w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          )}
        </h3>
        <button
          onClick={generateMusic}
          disabled={isLoading}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
        >
          {isLoading ? 'Generating...' : 'Generate'}
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Temperature</label>
          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.1"
            value={config.temperature}
            onChange={(e) => setConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-xs text-gray-400">{config.temperature.toFixed(1)}</span>
        </div>
        
        <div>
          <label className="block text-sm text-gray-300 mb-1">BPM</label>
          <input
            type="range"
            min="80"
            max="180"
            step="5"
            value={config.qpm}
            onChange={(e) => setConfig(prev => ({ ...prev, qpm: parseInt(e.target.value) }))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-xs text-gray-400">{config.qpm}</span>
        </div>
      </div>
      
      <div className="text-xs text-gray-400 space-y-1">
        <div>Model Status: {models.melody ? '✅ Loaded' : '⚠️ Fallback Mode'}</div>
        <div>Sequences Generated: {generationCountRef.current}</div>
        <div>Audio Reactivity: {((audioData.bass + audioData.mid + audioData.high) / 3 * 100).toFixed(0)}%</div>
      </div>
    </div>
  )
}

export default MagentaMusicEngine