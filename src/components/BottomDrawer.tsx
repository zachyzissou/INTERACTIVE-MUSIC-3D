'use client'
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useObjects } from '@/store/useObjects'
import { useEffectSettings } from '@/store/useEffectSettings'
import { useAudioSettings } from '@/store/useAudioSettings'
import { triggerSound } from '@/lib/soundTriggers'
import Knob from './JSAudioKnobs'

export default function BottomDrawer() {
  const spawn = useObjects(s => s.spawn)
  const objects = useObjects(s => s.objects)
  const selected = useEffectSettings(s => s.selected)
  const select = useEffectSettings(s => s.select)
  const {
    volume, setVolume,
    chorusDepth, setChorusDepth,
    delayFeedback, setDelayFeedback,
    reverbWet, setReverbWet,
    filterFrequency, setFilterFrequency,
  } = useAudioSettings()

  const obj = useMemo(() => objects.find(o => o.id === selected), [objects, selected])
  const [mode, setMode] = useState<'note'|'chord'|'beat'|'loop'>('note')

  const handlePlay = () => {
    if (!selected) return
    triggerSound(mode, selected)
  }

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: selected ? 0 : 'calc(100% - 4rem)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 w-full pointer-events-auto z-20"
    >
      <div className="bg-black/70 text-white p-4 flex flex-col gap-2">
        {!selected && (
          <button
            onClick={() => spawn('note')}
            className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-2xl shadow-lg"
          >
            +
          </button>
        )}
        {selected && obj && (
          <>
            <div className="flex items-center gap-2">
              <button onClick={handlePlay} className="px-3 py-1 bg-green-500 rounded">Play</button>
              <button onClick={() => select(null)} className="ml-auto px-3 py-1 bg-gray-600 rounded">Close</button>
            </div>
            <div className="flex gap-2">
              {(['note','chord','beat','loop'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setMode(t)}
                  className={`px-2 py-1 rounded ${mode===t ? 'bg-blue-500' : 'bg-gray-700'}`}
                >{t}</button>
              ))}
            </div>
            <div className="flex gap-4 overflow-x-auto py-2">
              <Knob label="Vol" min={0} max={1} step={0.01} value={volume} onChange={e=>setVolume(parseFloat(e.target.value))} />
              <Knob label="Chorus" min={0} max={1} step={0.01} value={chorusDepth} onChange={e=>setChorusDepth(parseFloat(e.target.value))} />
              <Knob label="Delay" min={0} max={1} step={0.01} value={delayFeedback} onChange={e=>setDelayFeedback(parseFloat(e.target.value))} />
              <Knob label="Reverb" min={0} max={1} step={0.01} value={reverbWet} onChange={e=>setReverbWet(parseFloat(e.target.value))} />
              <Knob label="Filter" min={20} max={1000} step={10} value={filterFrequency} onChange={e=>setFilterFrequency(parseFloat(e.target.value))} />
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}
