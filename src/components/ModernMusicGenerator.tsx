// src/components/ModernMusicGenerator.tsx
'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { secureAudioEngine, AudioSequence } from '../lib/audio-engine'

interface ModernMusicGeneratorProps {
  isPlaying?: boolean
  onSequenceGenerated?: (sequence: AudioSequence) => void
  className?: string
}

export function ModernMusicGenerator({ 
  isPlaying = false, 
  onSequenceGenerated,
  className = ""
}: Readonly<ModernMusicGeneratorProps>) {
  const [currentSequence, setCurrentSequence] = useState<AudioSequence | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    const initializeAudio = async () => {
      try {
        await secureAudioEngine.initialize()
        setIsInitialized(true)
      } catch (error) {
        console.error('Failed to initialize audio engine:', error)
      }
    }

    initializeAudio()
    
    return () => {
      secureAudioEngine.dispose()
    }
  }, [])

  const generateSequence = async () => {
    if (!isInitialized || isGenerating) return

    setIsGenerating(true)
    try {
      // Generate a random musical sequence
      const sequence = secureAudioEngine.generateRandomSequence(8)
      setCurrentSequence(sequence)
      onSequenceGenerated?.(sequence)
    } catch (error) {
      console.error('Failed to generate sequence:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const playSequence = useCallback(async () => {
    if (!currentSequence || !isInitialized) return

    try {
      await secureAudioEngine.playSequence(currentSequence)
    } catch (error) {
      console.error('Failed to play sequence:', error)
    }
  }, [currentSequence, isInitialized])

  const generateMelodyFromFrequency = (frequency: number) => {
    if (!isInitialized) return

    try {
      const melody = secureAudioEngine.createMelodyFromFrequency(frequency, 2)
      setCurrentSequence(melody)
      onSequenceGenerated?.(melody)
    } catch (error) {
      console.error('Failed to generate melody:', error)
    }
  }

  useEffect(() => {
    if (isPlaying && currentSequence) {
      playSequence()
    }
  }, [isPlaying, currentSequence, playSequence])

  return (
    <div className={`modern-music-generator ${className}`}>
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={generateSequence}
          disabled={!isInitialized || isGenerating}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg 
                     hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 font-medium shadow-lg"
        >
          {isGenerating ? 'Generating...' : 'Generate Music'}
        </button>
        
        <button
          onClick={playSequence}
          disabled={!currentSequence || !isInitialized}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg 
                     hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 font-medium shadow-lg"
        >
          Play Sequence
        </button>

        <button
          onClick={() => generateMelodyFromFrequency(440)} // A4
          disabled={!isInitialized}
          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg 
                     hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 font-medium shadow-lg"
        >
          Generate Melody
        </button>
      </div>

      {currentSequence && (
        <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4 border border-white/10">
          <h3 className="text-white font-semibold mb-2">Current Sequence</h3>
          <div className="text-sm text-gray-300 space-y-1">
            <p>BPM: {currentSequence.bpm}</p>
            <p>Time Signature: {currentSequence.timeSignature.join('/')}</p>
            <p>Notes: {currentSequence.notes.length}</p>
          </div>
          
          <div className="mt-3 flex flex-wrap gap-1">
            {currentSequence.notes.slice(0, 8).map((note, index) => (
              <div
                key={index}
                className="px-2 py-1 bg-white/10 rounded text-xs text-white border border-white/20"
              >
                {note.note}
              </div>
            ))}
          </div>
        </div>
      )}

      {!isInitialized && (
        <div className="text-yellow-400 text-sm">
          Initializing audio engine...
        </div>
      )}
    </div>
  )
}

export default ModernMusicGenerator
