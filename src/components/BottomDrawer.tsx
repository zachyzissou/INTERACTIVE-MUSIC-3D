'use client'
import { useState, useMemo, useCallback } from 'react'
import { motion } from '@motionone/react'
import { useObjects } from '@/store/useObjects'
import { useAudioSettings } from '@/store/useAudioSettings'
import { useEffectSettings } from '@/store/useEffectSettings'
import { useSelectedShape } from '@/store/useSelectedShape'
import { triggerSound } from '@/lib/soundTriggers'
import * as Tone from 'tone'
import Knob from './JSAudioKnobs'
import { objectTypes, ObjectType } from '@/config/objectTypes'
import { usePerformanceSettings, PerfLevel } from '@/store/usePerformanceSettings'

export default function BottomDrawer() {
  const objects = useObjects(s => s.objects)
  const { selected, selectShape } = useSelectedShape(s => ({
    selected: s.selected,
    selectShape: s.selectShape,
  }))
  const obj = useMemo(() => objects.find(o => o.id === selected), [objects, selected])
  const [mode, setMode] = useState<ObjectType>('note')
  const [playing, setPlaying] = useState(false)
  const [advanced, setAdvanced] = useState(false)
  const perfLevel = usePerformanceSettings(s => s.level)
  const setPerfLevel = usePerformanceSettings(s => s.setLevel)

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


  const togglePlay = useCallback(async () => {
    if (!selected) return
    const target = objects.find((o) => o.id === selected)
    if (!target) return
    if (playing && target.type === 'loop') {
      const { stopLoop } = require('@/lib/audio')
      stopLoop(selected)
      setPlaying(false)
    } else {
      await Tone.start()
      await Tone.getContext().resume()
      await triggerSound(mode, selected)
      setPlaying(true)
    }
  }, [selected, objects, playing, mode])

  const drawerClosedY = 120
  return (
    <div className="pointer-events-none">
      <motion.div
        initial={{ y: drawerClosedY }}
        animate={{ y: selected ? 0 : drawerClosedY }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 w-full bg-gray-900 bg-opacity-80 p-4 pointer-events-auto"
      >
        {selected && obj && (
          <div className="flex flex-col gap-2 text-white">
            <div className="flex gap-2">
              {objectTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => setMode(t)}
                  className={`px-2 py-1 rounded ${mode === t ? 'bg-blue-500' : 'bg-gray-700'}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 py-1">
              <label className="text-xs">Advanced</label>
              <input type="checkbox" checked={advanced} onChange={() => setAdvanced(a => !a)} />
              <select value={perfLevel} onChange={e => setPerfLevel(e.target.value as PerfLevel)} className="text-black rounded ml-auto text-xs">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="flex gap-4 overflow-x-auto py-2">
              <Knob label="Vol" min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} />
              {advanced && (
                <>
                  <Knob label="Chorus" min={0} max={1} step={0.01} value={chorusDepth} onChange={(e) => setChorusDepth(parseFloat(e.target.value))} />
                  <Knob label="Delay" min={0} max={1} step={0.01} value={delayFeedback} onChange={(e) => setDelayFeedback(parseFloat(e.target.value))} />
                  <Knob label="Bits" min={1} max={16} step={1} value={bitcrusherBits} onChange={(e) => setBitcrusherBits(parseInt(e.target.value, 10))} />
                </>
              )}
              <Knob label="Reverb" min={0} max={1} step={0.01} value={reverbWet} onChange={(e) => setReverbWet(parseFloat(e.target.value))} />
              <Knob label="Filter" min={20} max={1000} step={10} value={filterFrequency} onChange={(e) => setFilterFrequency(parseFloat(e.target.value))} />
            </div>
            {params && (
              <div className="flex gap-4 overflow-x-auto pb-2">
                <Knob label="Reverb" min={0} max={1} step={0.01} value={params.reverb} onChange={(e) => setEffect(selected!, { reverb: parseFloat(e.target.value) })} />
                <Knob label="Delay" min={0} max={1} step={0.01} value={params.delay} onChange={(e) => setEffect(selected!, { delay: parseFloat(e.target.value) })} />
                <Knob label="Lowpass" min={100} max={20000} step={100} value={params.lowpass} onChange={(e) => setEffect(selected!, { lowpass: parseFloat(e.target.value) })} />
                <Knob label="Highpass" min={0} max={1000} step={10} value={params.highpass} onChange={(e) => setEffect(selected!, { highpass: parseFloat(e.target.value) })} />
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={togglePlay} className="px-3 py-1 bg-green-500 rounded">
                {playing ? 'Pause' : 'Play'}
              </button>
              <button onClick={() => selectShape(null)} className="ml-auto px-3 py-1 bg-gray-600 rounded">
                Close
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
