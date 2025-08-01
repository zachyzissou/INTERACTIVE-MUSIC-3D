'use client'
import { useState, useMemo, useCallback } from 'react'
import { useObjects } from '@/store/useObjects'
import { useAudioSettings } from '@/store/useAudioSettings'
import { useEffectSettings } from '@/store/useEffectSettings'
import { useSelectedShape } from '@/store/useSelectedShape'
import { triggerSound } from '@/lib/soundTriggers'
import Knob from './JSAudioKnobs'
import LiquidButton from './LiquidButton'
import { objectTypes, ObjectType } from '@/config/objectTypes'
import { usePerformanceSettings, PerfLevel } from '@/store/usePerformanceSettings'
import MagicMelodyButton from './MagicMelodyButton'
import JamSessionButton from './JamSessionButton'
import GenerativeMusicEngine from './GenerativeMusicEngine'

export default function BottomDrawer() {
  // Use stable selectors to prevent infinite re-renders
  const objects = useObjects(useCallback(s => s.objects, []))
  const selected = useSelectedShape(useCallback(s => s.selected, []))
  const selectShape = useSelectedShape(useCallback(s => s.selectShape, []))
  
  const obj = useMemo(() => objects.find(o => o.id === selected), [objects, selected])
  const [mode, setMode] = useState<ObjectType>('note')
  const [playing, setPlaying] = useState(false)
  const [advanced, setAdvanced] = useState(false)
  const [showGenerative, setShowGenerative] = useState(false)
  
  const perfLevel = usePerformanceSettings(useCallback(s => s.level, []))
  const setPerfLevel = usePerformanceSettings(useCallback(s => s.setLevel, []))

  const volume = useAudioSettings(useCallback(s => s.volume, []))
  const setVolume = useAudioSettings(useCallback(s => s.setVolume, []))
  const chorusDepth = useAudioSettings(useCallback(s => s.chorusDepth, []))
  const setChorusDepth = useAudioSettings(useCallback(s => s.setChorusDepth, []))
  const delayFeedback = useAudioSettings(useCallback(s => s.delayFeedback, []))
  const setDelayFeedback = useAudioSettings(useCallback(s => s.setDelayFeedback, []))
  const reverbWet = useAudioSettings(useCallback(s => s.reverbWet, []))
  const setReverbWet = useAudioSettings(useCallback(s => s.setReverbWet, []))
  const bitcrusherBits = useAudioSettings(useCallback(s => s.bitcrusherBits, []))
  const setBitcrusherBits = useAudioSettings(useCallback(s => s.setBitcrusherBits, []))
  const filterFrequency = useAudioSettings(useCallback(s => s.filterFrequency, []))
  const setFilterFrequency = useAudioSettings(useCallback(s => s.setFilterFrequency, []))

  const setEffect = useEffectSettings(useCallback(s => s.setEffect, []))
  const getParams = useEffectSettings(useCallback(s => s.getParams, []))
  const params = useMemo(() => selected ? getParams(selected) : null, [selected, getParams])


  const togglePlay = useCallback(async () => {
    if (!selected) {
      console.warn('🎵 BottomDrawer: No shape selected')
      return
    }
    const target = objects.find((o) => o.id === selected)
    if (!target) {
      console.warn('🎵 BottomDrawer: Selected object not found:', selected)
      return
    }
    
    
    if (playing && target.type === 'loop') {
      const { stopLoop } = require('@/lib/audio')
      stopLoop(selected)
      setPlaying(false)
    } else {
      const success = await triggerSound(mode as any, selected)
      setPlaying(success)
    }
  }, [selected, objects, playing, mode])

  return (
    <div className="pointer-events-none">
      <div
        className={`fixed bottom-0 left-0 w-full pointer-events-auto transition-transform duration-300 ease-out ${
          selected ? 'translate-y-0' : 'translate-y-[120px]'
        }`}
      >
        {/* Liquid background with glassmorphism */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-purple-900/50 to-transparent backdrop-blur-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 animate-pulse" />
        </div>
        
        {selected && obj && (
          <div className="relative z-10 flex flex-col gap-4 p-6 text-white">
            {/* Mode Selection with Liquid Buttons */}
            <div className="flex gap-3 justify-center">
              {objectTypes.map((t) => (
                <LiquidButton
                  key={t}
                  onClick={() => setMode(t)}
                  variant={mode === t ? 'primary' : 'secondary'}
                  className={`px-4 py-2 text-sm ${mode === t ? 'ring-2 ring-white/50' : ''}`}
                >
                  {t.toUpperCase()}
                </LiquidButton>
              ))}
            </div>

            {/* Play/Pause Button */}
            <div className="flex justify-center">
              <LiquidButton
                onClick={togglePlay}
                variant="accent"
                className="px-8 py-3 text-lg font-bold"
              >
                {playing ? '⏸️ PAUSE' : '▶️ PLAY'}
              </LiquidButton>
            </div>

            {/* Enhanced Feature Toggle Row */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input 
                    type="checkbox" 
                    checked={advanced} 
                    onChange={() => setAdvanced(a => !a)}
                    className="w-4 h-4 rounded border-2 border-purple-500 bg-transparent checked:bg-purple-500"
                    title="Advanced Controls"
                  />
                  <span className="text-purple-200">Advanced</span>
                </label>
                
                <label className="flex items-center gap-2 text-sm">
                  <input 
                    type="checkbox" 
                    checked={showGenerative} 
                    onChange={() => setShowGenerative(g => !g)}
                    className="w-4 h-4 rounded border-2 border-blue-500 bg-transparent checked:bg-blue-500"
                    title="AI Generative Music"
                  />
                  <span className="text-blue-200">🎼 AI Music</span>
                </label>
              </div>
              
              <select 
                value={perfLevel} 
                onChange={e => setPerfLevel(e.target.value as PerfLevel)} 
                className="text-black rounded px-2 py-1 text-xs bg-white/90"
                title="Performance Level"
              >
                <option value="low">Eco Mode</option>
                <option value="medium">Balanced</option>
                <option value="high">Performance</option>
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
            {params && selected && (
              <div className="flex gap-4 overflow-x-auto pb-2">
                <Knob label="Reverb" min={0} max={1} step={0.01} value={params.reverb} onChange={(e) => setEffect(selected, { reverb: parseFloat(e.target.value) })} />
                <Knob label="Delay" min={0} max={1} step={0.01} value={params.delay} onChange={(e) => setEffect(selected, { delay: parseFloat(e.target.value) })} />
                <Knob label="Lowpass" min={100} max={20000} step={100} value={params.lowpass} onChange={(e) => setEffect(selected, { lowpass: parseFloat(e.target.value) })} />
                <Knob label="Highpass" min={0} max={1000} step={10} value={params.highpass} onChange={(e) => setEffect(selected, { highpass: parseFloat(e.target.value) })} />
              </div>
            )}
            
            {/* Generative Music Engine */}
            {showGenerative && (
              <div className="mt-4">
                <GenerativeMusicEngine isPlaying={playing} />
              </div>
            )}
            
            <MagicMelodyButton />
            <JamSessionButton />
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
      </div>
    </div>
  )
}
