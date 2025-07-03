'use client'
import React, { useState } from 'react'
import { generateMelody } from '../lib/ai'
import { useSelectedShape } from '../store/useSelectedShape'
import { useMelodies } from '../store/useMelodies'
import { playNote } from '../lib/audio'
import { useObjects } from '../store/useObjects'

export default function MagicMelodyButton() {
  const selected = useSelectedShape((s) => s.selected)
  const spawn = useObjects((s) => s.spawn)
  const setMelody = useMelodies((s) => s.setMelody)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handle = async () => {
    const id = selected || spawn('note')
    setLoading(true)
    const melody = await generateMelody()
    setLoading(false)
    setMelody(id, melody)
    setDone(true)
    setTimeout(() => setDone(false), 1000)
    const Tone = await import('tone')
    melody.notes.forEach((n, i) => {
      const note = Tone.Frequency(n.note, 'midi').toNote()
      setTimeout(() => playNote(id, note), n.time * 1000)
    })
  }
  return (
    <button
      onClick={handle}
      disabled={loading}
      className="px-2 py-1 bg-purple-500 text-white rounded text-xs disabled:opacity-50"
    >
      {loading ? 'Loading...' : done ? 'Done!' : 'Magic Melody'}
    </button>
  )
}
