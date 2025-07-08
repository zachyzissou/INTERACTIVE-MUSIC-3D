'use client'
// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from 'react'
import * as mm from '@magenta/music'
import { gsap } from 'gsap'
import { useAudioStore } from '../../store/useAudioStore'

interface MagentaMusicGeneratorProps {
  onNoteGenerated?: (note: mm.NoteSequence.Note) => void
  onSequenceGenerated?: (sequence: mm.NoteSequence) => void
  isPlaying?: boolean
  audioReactive?: boolean
  className?: string
}

export function MagentaMusicGenerator({
  onNoteGenerated,
  onSequenceGenerated,
  isPlaying = false
}: MagentaMusicGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [model, setModel] = useState<mm.MusicRNN | null>(null)
  const [player, setPlayer] = useState<mm.SoundFontPlayer | null>(null)
  const [currentSequence, setCurrentSequence] = useState<mm.INoteSequence | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [temperature, setTemperature] = useState(1.0)
  const [sequenceLength, setSequenceLength] = useState(32)
  
  const visualizerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Initialize Magenta models
  useEffect(() => {
    async function initializeModels() {
      setIsLoading(true)
      try {
        // Initialize Music RNN model
        const musicRNN = new mm.MusicRNN('https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/melody_rnn')
        await musicRNN.initialize()
        setModel(musicRNN)

        // Initialize SoundFont player
        const soundFontPlayer = new mm.SoundFontPlayer('https://storage.googleapis.com/magentadata/js/soundfonts/gm_synth')
        // Use a default sequence for initial loading
        await soundFontPlayer.loadSamples({ notes: [], totalTime: 4 })
        setPlayer(soundFontPlayer)

        // Magenta models initialized successfully
      } catch (error) {
        console.error('Failed to initialize Magenta models:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeModels()
  }, [])

  // Generate melody using Magenta
  const generateMelody = useCallback(async () => {
    if (!model) return

    setIsGenerating(true)
    try {
      // Create seed sequence
      const seed: mm.INoteSequence = {
        notes: [
          { pitch: 60, startTime: 0, endTime: 0.5, velocity: 80 },
          { pitch: 64, startTime: 0.5, endTime: 1.0, velocity: 80 },
          { pitch: 67, startTime: 1.0, endTime: 1.5, velocity: 80 },
        ],
        totalTime: 1.5,
        ticksPerQuarter: 220,
        tempos: [{ time: 0, qpm: 120 }],
        timeSignatures: [{ time: 0, numerator: 4, denominator: 4 }]
      }

      // Generate continuation
      const result = await model.continueSequence(seed, sequenceLength, temperature)
      setCurrentSequence(result)
      
      // Trigger callbacks
      onSequenceGenerated?.(result as any)
      result?.notes?.forEach(note => onNoteGenerated?.(note as any))

      // Animate visualizer
      if (result?.notes) {
        animateNoteGeneration(result.notes as any[])
      }
      
    } catch (error) {
      console.error('Melody generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, sequenceLength, temperature, onNoteGenerated, onSequenceGenerated])

  // Play generated sequence
  const playSequence = useCallback(async () => {
    if (!player || !currentSequence) return

    try {
      await player.start(currentSequence)
      
      // Visual feedback during playback
      currentSequence?.notes?.forEach((note, index) => {
        setTimeout(() => {
          animateNotePlay(note as any)
        }, (note.startTime ?? 0) * 1000)
      })
      
    } catch (error) {
      console.error('Playback failed:', error)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, currentSequence])

  // Stop playback
  const stopSequence = useCallback(() => {
    if (player) {
      player.stop()
    }
  }, [player])

  // Animate note generation
  const animateNoteGeneration = useCallback((notes: mm.NoteSequence.Note[]) => {
    if (!visualizerRef.current) return

    notes.forEach((note, index) => {
      const noteElement = document.createElement('div')
      noteElement.className = 'note-particle'
      noteElement.style.cssText = `
        position: absolute;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: linear-gradient(45deg, #ff0080, #00ffff);
        box-shadow: 0 0 10px rgba(255, 0, 128, 0.5);
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
      `
      
      visualizerRef.current?.appendChild(noteElement)

      // Animate particle
      gsap.fromTo(noteElement,
        { scale: 0, opacity: 1 },
        {
          scale: 1 + (note.velocity / 127),
          opacity: 0,
          duration: 2,
          ease: "power2.out",
          onComplete: () => {
            noteElement.remove()
          }
        }
      )
    })
  }, [])

  // Animate note playback
  const animateNotePlay = useCallback((note: mm.NoteSequence.Note) => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Create visual representation of note
    const intensity = note.velocity / 127
    const hue = (note.pitch - 60) * 6 // Map pitch to hue
    
    ctx.globalAlpha = intensity
    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`
    ctx.fillRect(
      Math.random() * canvas.width,
      Math.random() * canvas.height,
      20 * intensity,
      20 * intensity
    )

    // Fade out
    setTimeout(() => {
      ctx.globalAlpha = 0.1
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }, 200)
  }, [])

  // Canvas animation loop
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number

    const animate = () => {
      // Create ambient particle effect
      ctx.globalAlpha = 0.1
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      if (isPlaying) {
        // Add some reactive visual elements
        const time = Date.now() * 0.001
        ctx.globalAlpha = 0.3
        ctx.fillStyle = `hsl(${time * 50}, 70%, 50%)`
        ctx.fillRect(
          Math.sin(time) * 50 + canvas.width / 2,
          Math.cos(time * 0.7) * 30 + canvas.height / 2,
          10,
          10
        )
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [isPlaying])

  return (
    <div className="magenta-generator fixed bottom-4 right-4 z-40 bg-black/20 backdrop-blur-xl border border-white/20 rounded-xl p-4 min-w-[280px]">
      <h3 className="text-white font-bold text-lg mb-4 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        AI Music Generator
      </h3>

      {/* Visualizer */}
      <div 
        ref={visualizerRef}
        className="relative w-full h-24 mb-4 bg-black/30 rounded-lg overflow-hidden"
      >
        <canvas 
          ref={canvasRef}
          width={280}
          height={96}
          className="absolute inset-0 w-full h-full"
        />
      </div>

      {/* Controls */}
      <div className="space-y-3">
        {/* Temperature Control */}
        <div>
          <label className="block text-white text-sm font-medium mb-1">
            Creativity: {temperature.toFixed(2)}
          </label>
          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="w-full h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg appearance-none cursor-pointer"
            aria-label="AI Creativity Level"
            title="Adjust AI creativity from conservative to experimental"
          />
        </div>

        {/* Sequence Length */}
        <div>
          <label className="block text-white text-sm font-medium mb-1">
            Length: {sequenceLength} notes
          </label>
          <input
            type="range"
            min="8"
            max="64"
            step="8"
            value={sequenceLength}
            onChange={(e) => setSequenceLength(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            aria-label="Sequence Length"
            title="Set the number of notes to generate"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={generateMelody}
            disabled={isLoading || isGenerating || !model}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded-lg font-medium transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>

          <button
            onClick={playSequence}
            disabled={!currentSequence || !player}
            className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white py-2 px-4 rounded-lg font-medium transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Play
          </button>

          <button
            onClick={stopSequence}
            disabled={!player}
            className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 text-white py-2 px-4 rounded-lg font-medium transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Stop
          </button>
        </div>

        {/* Status */}
        <div className="text-center text-white/60 text-xs">
          {isLoading && 'Loading AI models...'}
          {!isLoading && !model && 'Failed to load models'}
          {!isLoading && model && 'Ready to generate music'}
        </div>
      </div>
    </div>
  )
}
