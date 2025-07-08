'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { gsap } from 'gsap'
import { 
  PlayIcon, 
  PauseIcon, 
  SpeakerWaveIcon, 
  SpeakerXMarkIcon,
  Bars3Icon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  Cog6ToothIcon,
  MusicalNoteIcon,
  SparklesIcon,
  AdjustmentsHorizontalIcon,
  BoltIcon,
  FireIcon,
  BeakerIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import AudioVisualizer from './AudioVisualizer'
import ShaderSelector from './ShaderSelector'
import ShaderControls from './ShaderControls'
import '@/styles/god-tier-ui.css'
import type { ShaderIconType } from '@/config/shaderConfigs'

interface AudioData {
  bass: number
  mid: number
  high: number
  volume: number
  spectrum: Float32Array
}

interface ShaderConfig {
  id: string
  name: string
  iconType: ShaderIconType
  params: {
    [key: string]: {
      value: number
      min: number
      max: number
      step: number
      label: string
    }
  }
}

interface GodTierUIProps {
  audioData: AudioData
  onAudioToggle: () => void
  onVolumeChange: (volume: number) => void
  onShaderChange: (shaderId: string) => void
  onParamChange: (shaderId: string, paramName: string, value: number) => void
  isPlaying: boolean
  currentShader: string
  shaderConfigs: ShaderConfig[]
}

const GodTierUI: React.FC<GodTierUIProps> = ({
  audioData,
  onAudioToggle,
  onVolumeChange,
  onShaderChange,
  onParamChange,
  isPlaying,
  currentShader,
  shaderConfigs
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activePanel, setActivePanel] = useState<'audio' | 'shaders' | 'effects' | null>(null)
  const [position, setPosition] = useState({ x: 20, y: 20 })
  
  const mainPanelRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<HTMLDivElement>(null)

  // Drag functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = mainPanelRef.current?.getBoundingClientRect()
    if (rect) {
      const offsetX = e.clientX - rect.left
      const offsetY = e.clientY - rect.top
      
      const handleMouseMove = (e: MouseEvent) => {
        setPosition({
          x: e.clientX - offsetX,
          y: e.clientY - offsetY
        })
      }
      
      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
      
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }
  }, [])

  // Auto-collapse after inactivity
  useEffect(() => {
    if (isExpanded) {
      const timer = setTimeout(() => {
        setIsExpanded(false)
        setActivePanel(null)
      }, 10000) // Auto-collapse after 10 seconds
      
      return () => clearTimeout(timer)
    }
  }, [isExpanded, activePanel])

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onVolumeChange(parseFloat(e.target.value))
  }, [onVolumeChange])

  return (
    <>
      {/* Main Control Hub */}
      <motion.div
        ref={mainPanelRef}
        className="god-tier-main-panel"
        style={{ 
          left: position.x, 
          top: position.y
        }}
        drag
        dragMomentum={false}
        onDrag={(_, info) => {
          setPosition({
            x: position.x + info.delta.x,
            y: position.y + info.delta.y
          })
        }}
      >
        <div className="overflow-hidden border shadow-2xl bg-black/80 backdrop-blur-xl rounded-2xl border-gray-700/50">
          {/* Main Control Bar */}
          <div className="flex items-center p-4 space-x-3 bg-gradient-to-r from-purple-900/30 to-cyan-900/30">
            <motion.button
              onClick={onAudioToggle}
              className={`
                p-2 rounded-full transition-all duration-200
                ${isPlaying 
                  ? 'bg-green-500/20 text-green-400 border border-green-400/50' 
                  : 'bg-red-500/20 text-red-400 border border-red-400/50'
                }
              `}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
            >
              {isPlaying ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
            </motion.button>

            <div className="flex items-center p-3 space-x-2 rounded-lg bg-black/30 backdrop-blur-md">
              <div className="flex space-x-1">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1 transition-all duration-75 rounded-full bg-gradient-to-t from-cyan-500 to-purple-500 god-tier-spectrum-bar"
                    aria-label={`Spectrum bar ${i}`}
                    style={{
                      // @ts-ignore
                      '--bar-height': `${Math.max(4, (audioData.spectrum?.[i] || 0) * 40)}px`
                    }}
                  />
                ))}
              </div>
              <div className="text-xs text-gray-300">
                <div>Bass: {Math.round(audioData.bass * 100)}</div>
                <div>Mid: {Math.round(audioData.mid * 100)}</div>
                <div>High: {Math.round(audioData.high * 100)}</div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <label htmlFor="volume-slider" className="sr-only">Volume</label>
              <SpeakerWaveIcon className="w-4 h-4 text-gray-400" />
              <input
                id="volume-slider"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={audioData.volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="w-20 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                title="Volume"
              />
            </div>

            <div className="flex space-x-1">
              <motion.button
                onClick={() => {
                  setActivePanel(activePanel === 'audio' ? null : 'audio')
                  setIsExpanded(!isExpanded || activePanel !== 'audio')
                }}
                className={`
                  p-2 rounded-lg transition-all duration-200
                  ${activePanel === 'audio' 
                    ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/50' 
                    : 'bg-gray-700/30 text-gray-400 hover:bg-gray-600/30'
                  }
                `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Toggle audio panel"
              >
                <MusicalNoteIcon className="w-4 h-4" />
              </motion.button>

              <motion.button
                onClick={() => {
                  setActivePanel(activePanel === 'shaders' ? null : 'shaders')
                  setIsExpanded(!isExpanded || activePanel !== 'shaders')
                }}
                className={`
                  p-2 rounded-lg transition-all duration-200
                  ${activePanel === 'shaders' 
                    ? 'bg-purple-400/20 text-purple-400 border border-purple-400/50' 
                    : 'bg-gray-700/30 text-gray-400 hover:bg-gray-600/30'
                  }
                `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Toggle shader panel"
              >
                <SparklesIcon className="w-4 h-4" />
              </motion.button>

              <motion.button
                onClick={() => {
                  setActivePanel(activePanel === 'effects' ? null : 'effects')
                  setIsExpanded(!isExpanded || activePanel !== 'effects')
                }}
                className={`
                  p-2 rounded-lg transition-all duration-200
                  ${activePanel === 'effects' 
                    ? 'bg-orange-400/20 text-orange-400 border border-orange-400/50' 
                    : 'bg-gray-700/30 text-gray-400 hover:bg-gray-600/30'
                  }
                `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Toggle effects panel"
              >
                <AdjustmentsHorizontalIcon className="w-4 h-4" />
              </motion.button>
            </div>

            <motion.button
              onClick={() => {
                setIsExpanded(!isExpanded)
                if (!isExpanded) setActivePanel(null)
              }}
              className="p-2 text-gray-400 transition-all duration-200 rounded-lg bg-gray-700/30 hover:bg-gray-600/30"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={isExpanded ? 'Collapse panel' : 'Expand panel'}
            >
              {isExpanded ? <XMarkIcon className="w-4 h-4" /> : <Bars3Icon className="w-4 h-4" />}
            </motion.button>
          </div>

          {/* Drag Handle for repositioning */}
          <div 
            ref={dragRef}
            onMouseDown={handleMouseDown}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
              }
            }}
            className="absolute top-0 left-0 right-0 h-2 transition-opacity opacity-0 cursor-grab active:cursor-grabbing hover:opacity-20 bg-white/20"
            aria-label="Drag to reposition panel"
          />

          {/* Expanded Panels */}
          <AnimatePresence>
            {isExpanded && activePanel && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="border-t border-gray-700/50"
              >
                <div className="p-4 overflow-y-auto max-h-96 god-tier-custom-scrollbar">
                  {activePanel === 'audio' && <AudioVisualizer audioData={audioData} />}
                  {activePanel === 'shaders' && (
                    <div className="space-y-4">
                      <ShaderSelector 
                        shaderConfigs={shaderConfigs}
                        currentShader={currentShader}
                        onShaderChange={onShaderChange}
                      />
                      <div className="pt-4 border-t border-gray-700/50">
                        <ShaderControls
                          shaderConfigs={shaderConfigs}
                          currentShader={currentShader}
                          onParamChange={onParamChange}
                        />
                      </div>
                    </div>
                  )}
                  {activePanel === 'effects' && (
                    <div className="space-y-3">
                      <h3 className="mb-3 text-sm font-medium text-gray-200">Audio Effects</h3>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between mb-1 text-xs text-gray-400">
                            <label htmlFor="reverb-slider">Reverb</label>
                            <span>0.30</span>
                          </div>
                          <input 
                            id="reverb-slider"
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.01" 
                            className="w-full slider" 
                            title="Reverb"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1 text-xs text-gray-400">
                            <label htmlFor="distortion-slider">Distortion</label>
                            <span>0.15</span>
                          </div>
                          <input 
                            id="distortion-slider"
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.01" 
                            className="w-full slider" 
                            title="Distortion"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Performance Monitor Mini-Widget */}
      <div className="god-tier-performance-monitor">
        <div className="flex items-center space-x-3">
          <div>FPS: <span className="text-green-400">60</span></div>
          <div>GPU: <span className="text-blue-400">85%</span></div>
          <ComputerDesktopIcon className="w-4 h-4" />
        </div>
      </div>

      {/* Accessibility Skip Links */}
      <div className="sr-only">
        <a href="#audio-controls" className="god-tier-skip-link">Skip to audio controls</a>
        <a href="#shader-controls" className="god-tier-skip-link">Skip to shader controls</a>
        <a href="#effects-controls" className="god-tier-skip-link">Skip to effects controls</a>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .slider {
          background: linear-gradient(90deg, #374151 0%, #6366f1 100%);
          outline: none;
          border-radius: 8px;
        }
        .spectrum-bar {
          height: var(--bar-height, 8px);
        }
      `}</style>
    </>
  )
}

export default GodTierUI
