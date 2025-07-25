'use client'
import React from 'react'
import { useMusicalPalette, MusicalKey, MusicalScale } from '@/store/useMusicalPalette'
import { 
  MusicalNoteIcon, 
  PlayIcon, 
  PencilIcon, 
  MicrophoneIcon,
  QueueListIcon,
  ForwardIcon,
  BackwardIcon
} from '@heroicons/react/24/outline'

const keys: MusicalKey[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const scales: { value: MusicalScale; label: string }[] = [
  { value: 'major', label: 'Major' },
  { value: 'minor', label: 'Minor' },
  { value: 'dorian', label: 'Dorian' },
  { value: 'mixolydian', label: 'Mixolydian' },
  { value: 'pentatonic', label: 'Pentatonic' },
  { value: 'blues', label: 'Blues' }
]

const modes = [
  { value: 'play' as const, label: 'Play', icon: PlayIcon, color: 'text-green-400' },
  { value: 'edit' as const, label: 'Edit', icon: PencilIcon, color: 'text-blue-400' },
  { value: 'record' as const, label: 'Record', icon: MicrophoneIcon, color: 'text-red-400' },
  { value: 'sequence' as const, label: 'Sequence', icon: QueueListIcon, color: 'text-purple-400' }
]

export default function MusicalPaletteControls() {
  const {
    key, scale, tempo, octave, mode, scaleNotes,
    setKey, setScale, setTempo, setOctave, setMode
  } = useMusicalPalette()

  return (
    <div className="bg-black/90 backdrop-blur-xl border border-gray-700/50 rounded-xl p-4 space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <MusicalNoteIcon className="w-5 h-5 text-purple-400" />
        <h3 className="text-sm font-semibold text-white">Musical Palette</h3>
      </div>

      {/* Mode Selection */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400 uppercase tracking-wide">Mode</label>
        <div className="grid grid-cols-2 gap-2">
          {modes.map(({ value, label, icon: Icon, color }) => (
            <button
              key={value}
              onClick={() => setMode(value)}
              className={`
                flex items-center space-x-2 p-2 rounded-lg transition-all duration-200
                ${mode === value 
                  ? 'bg-white/10 border border-white/30' 
                  : 'bg-gray-800/50 hover:bg-gray-700/50'
                }
              `}
            >
              <Icon className={`w-4 h-4 ${mode === value ? color : 'text-gray-400'}`} />
              <span className={`text-xs ${mode === value ? 'text-white' : 'text-gray-400'}`}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Key and Scale */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs text-gray-400 uppercase tracking-wide">Key</label>
          <select
            value={key}
            onChange={(e) => setKey(e.target.value as MusicalKey)}
            className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-400 focus:outline-none"
          >
            {keys.map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-gray-400 uppercase tracking-wide">Scale</label>
          <select
            value={scale}
            onChange={(e) => setScale(e.target.value as MusicalScale)}
            className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-400 focus:outline-none"
          >
            {scales.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tempo and Octave */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs text-gray-400 uppercase tracking-wide">
            Tempo: {tempo} BPM
          </label>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setTempo(tempo - 5)}
              className="p-1 rounded bg-gray-700/50 hover:bg-gray-600/50 transition-colors"
            >
              <BackwardIcon className="w-3 h-3 text-gray-300" />
            </button>
            <input
              type="range"
              min="60"
              max="200"
              step="5"
              value={tempo}
              onChange={(e) => setTempo(parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <button
              onClick={() => setTempo(tempo + 5)}
              className="p-1 rounded bg-gray-700/50 hover:bg-gray-600/50 transition-colors"
            >
              <ForwardIcon className="w-3 h-3 text-gray-300" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-gray-400 uppercase tracking-wide">
            Octave: {octave}
          </label>
          <input
            type="range"
            min="2"
            max="7"
            value={octave}
            onChange={(e) => setOctave(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </div>

      {/* Current Scale Notes */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400 uppercase tracking-wide">
          Scale Notes ({key} {scale})
        </label>
        <div className="flex flex-wrap gap-1">
          {scaleNotes.map((note, index) => (
            <span
              key={`${note}-${index}`}
              className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-xs text-purple-300 font-mono"
            >
              {note}
            </span>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="border-t border-gray-700/50 pt-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button className="px-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-xs text-blue-300 hover:bg-blue-500/30 transition-colors">
            Clear All
          </button>
          <button className="px-3 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-xs text-green-300 hover:bg-green-500/30 transition-colors">
            Random
          </button>
        </div>
      </div>
    </div>
  )
}