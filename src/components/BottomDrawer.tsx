'use client'
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useObjects } from '@/store/useObjects'
import { useAudioSettings } from '@/store/useAudioSettings'
import { useEffectSettings } from '@/store/useEffectSettings'
import { useSelectedShape } from '@/store/useSelectedShape'
import { triggerSound } from '@/lib/soundTriggers'
import Knob from './JSAudioKnobs'
import { objectTypes, ObjectType } from '@/config/objectTypes'

export default function BottomDrawer() {
  const spawn = useObjects(s => s.spawn)
  const objects = useObjects(s => s.objects)
  const { selected, selectShape } = useSelectedShape(s => ({
    selected: s.selected,
    selectShape: s.selectShape,
  }))
  const obj = useMemo(() => objects.find(o => o.id === selected), [objects, selected])
  const [mode, setMode] = useState<ObjectType>('note')

  const {
    volume, setVolume,
    chorusDepth, setChorusDepth,
    delayFeedback, setDelayFeedback,
    reverbWet, setReverbWet,
    bitcrusherBits, setBitcrusherBits,
    filterFrequency, setFilterFrequency,
  } = useAudioSettings()

  const { setEffect, getParams } = useEffectSettings()
  const params = selected ? getParams(selected) : null

  const handleSpawn = () => {
    const id = spawn('note')
    selectShape(id)
  }

  const handlePlay = () => {
    if (!selected) return
    triggerSound(mode, selected)
  }

  return (
    <div className="pointer-events-none">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: selected ? 0 : '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 w-full pointer-events-auto z-10"
      >
        {selected && obj && (
          <div className="bg-black/70 text-white p-4 flex flex-col gap-2">
            <div className="flex gap-2">
              {objectTypes.map(t => (
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
              <Knob label="Bits" min={1} max={16} step={1} value={bitcrusherBits} onChange={e=>setBitcrusherBits(parseInt(e.target.value,10))} />
            </div>
            {params && (
              <div className="flex gap-4 overflow-x-auto pb-2">
                <Knob label="Reverb" min={0} max={1} step={0.01} value={params.reverb} onChange={e=>setEffect(selected!, { reverb: parseFloat(e.target.value) })} />
                <Knob label="Delay" min={0} max={1} step={0.01} value={params.delay} onChange={e=>setEffect(selected!, { delay: parseFloat(e.target.value) })} />
                <Knob label="Lowpass" min={100} max={20000} step={100} value={params.lowpass} onChange={e=>setEffect(selected!, { lowpass: parseFloat(e.target.value) })} />
                <Knob label="Highpass" min={0} max={1000} step={10} value={params.highpass} onChange={e=>setEffect(selected!, { highpass: parseFloat(e.target.value) })} />
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={handlePlay} className="px-3 py-1 bg-green-500 rounded">Play</button>
              <button onClick={() => selectShape(null)} className="ml-auto px-3 py-1 bg-gray-600 rounded">Close</button>
            </div>
          </div>
        )}
      </motion.div>
      <button
        onClick={handleSpawn}
        className="fixed bottom-4 left-4 w-12 h-12 rounded-full bg-primary shadow-lg flex items-center justify-center text-2xl text-white pointer-events-auto"
      >
        +
      </button>
    </div>
  )
}
