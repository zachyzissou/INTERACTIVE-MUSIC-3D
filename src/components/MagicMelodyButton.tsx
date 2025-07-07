'use client'
import React, { useState } from 'react'
import { generateMelody } from '../lib/ai'
import { generateEnhancedMelody } from '../lib/aiMelodyGenerator'
import { useSelectedShape } from '../store/useSelectedShape'
import { useMelodies } from '../store/useMelodies'
import { playNote } from '../lib/audio'
import { useObjects } from '../store/useObjects'
import { logger } from '../lib/logger'

type MelodyStyle = 'classical' | 'jazz' | 'pop' | 'ambient'

export default function MagicMelodyButton() {
  const selected = useSelectedShape((s) => s.selected)
  const spawn = useObjects((s) => s.spawn)
  const setMelody = useMelodies((s) => s.setMelody)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [melodyStyle, setMelodyStyle] = useState<MelodyStyle>('pop')
  const [showStyleSelector, setShowStyleSelector] = useState(false)

  const handle = async () => {
    const id = selected ?? spawn('note')
    setLoading(true)
    
    try {
      // Use enhanced AI melody generator
      const enhancedMelody = await generateEnhancedMelody({
        style: melodyStyle,
        complexity: 'moderate',
        length: 8,
        withHarmony: false
      })
      
      // Convert string notes to MIDI numbers for compatibility
      const convertedMelody = {
        notes: enhancedMelody.notes.map(n => ({
          time: n.time,
          note: convertNoteToMidi(n.note),
          duration: n.duration,
          velocity: n.velocity
        }))
      }
      
      setMelody(id, convertedMelody)
      setDone(true)
      setTimeout(() => setDone(false), 1500)
      
      // Play the generated melody  
      enhancedMelody.notes.forEach((n, i) => {
        setTimeout(() => playNote(id, n.note), n.time * 1000)
      })
      
      logger.info(`Generated ${melodyStyle} melody with ${enhancedMelody.notes.length} notes`)
    } catch (error) {
      logger.error('Failed to generate melody: ' + String(error))
      // Fallback to original generator
      const melody = await generateMelody()
      setMelody(id, melody)
      setDone(true)
      setTimeout(() => setDone(false), 1000)
    }
    
    setLoading(false)
  }

  const convertNoteToMidi = (note: string): number => {
    const noteMap: Record<string, number> = {
      'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
      'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
    }
    const noteName = note.slice(0, -1)
    const octave = parseInt(note.slice(-1)) || 4
    return noteMap[noteName] + (octave * 12)
  }

  const getButtonText = () => {
    if (loading) return 'Generating...'
    if (done) return 'Created!'
    return 'AI Melody'
  }

  const styleOptions: { value: MelodyStyle; label: string; emoji: string }[] = [
    { value: 'pop', label: 'Pop', emoji: '🎵' },
    { value: 'classical', label: 'Classical', emoji: '🎼' },
    { value: 'jazz', label: 'Jazz', emoji: '🎷' },
    { value: 'ambient', label: 'Ambient', emoji: '🌙' }
  ]

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        <button
          onClick={handle}
          disabled={loading}
          className="px-3 py-2 bg-purple-500 text-white rounded-lg text-sm disabled:opacity-50 hover:bg-purple-600 transition-colors flex items-center space-x-2"
        >
          <span>{getButtonText()}</span>
        </button>
        
        <button
          onClick={() => setShowStyleSelector(!showStyleSelector)}
          className="px-2 py-2 bg-purple-400 text-white rounded-lg text-sm hover:bg-purple-500 transition-colors"
          title="Select melody style"
        >
          {styleOptions.find(s => s.value === melodyStyle)?.emoji}
        </button>
      </div>

      {showStyleSelector && (
        <div className="absolute top-full mt-2 left-0 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10 min-w-32">
          {styleOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setMelodyStyle(option.value)
                setShowStyleSelector(false)
              }}
              className={`w-full px-3 py-2 text-left hover:bg-gray-700 transition-colors flex items-center space-x-2 ${
                melodyStyle === option.value ? 'bg-purple-600 text-white' : 'text-gray-300'
              } ${option.value === styleOptions[0].value ? 'rounded-t-lg' : ''} ${
                option.value === styleOptions[styleOptions.length - 1].value ? 'rounded-b-lg' : ''
              }`}
            >
              <span className="text-lg">{option.emoji}</span>
              <span className="text-sm">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
