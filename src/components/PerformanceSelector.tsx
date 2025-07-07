'use client'
import { useEffect, useState } from 'react'
import { usePerformanceSettings, PerfLevel } from '@/store/usePerformanceSettings'
import { a, useSpring } from '@react-spring/web'

export default function PerformanceSelector() {
  const [show, setShow] = useState(false)
  const [showButton, setShowButton] = useState(true)
  const setLevel = usePerformanceSettings(s => s.setLevel)
  const level = usePerformanceSettings(s => s.level)
  const [springs, api] = useSpring(() => ({ opacity: 1 }))
  useEffect(() => {
    const saved = localStorage.getItem('perf-level') as PerfLevel | null
    if (saved) {
      setLevel(saved)
    } else {
      // Auto-detect performance level instead of showing selector by default
      // This prevents blocking the start overlay
      const cpuCores = navigator.hardwareConcurrency || 4
      const memory = (navigator as any).deviceMemory || 4
      
      let autoLevel: PerfLevel
      if (cpuCores >= 8 && memory >= 8) {
        autoLevel = 'high'
      } else if (cpuCores >= 4 && memory >= 4) {
        autoLevel = 'medium'  
      } else {
        autoLevel = 'low'
      }
      
      setLevel(autoLevel)
      localStorage.setItem('perf-level', autoLevel)
      
      // Show selector briefly so user knows they can change it
      setShow(true)
      setTimeout(() => {
        api.start({ opacity: 0, onRest: () => setShow(false) })
      }, 3000)
    }
  }, [setLevel, api])
  
  const choose = (lvl: PerfLevel) => {
    localStorage.setItem('perf-level', lvl)
    setLevel(lvl)
    api.start({ opacity: 0, onRest: () => setShow(false) })
  }
  
  const openSelector = () => {
    setShow(true)
    api.start({ opacity: 1 })
  }
  
  return (
    <>
      {/* Manual trigger button */}
      {showButton && !show && (
        <button
          onClick={openSelector}
          className="fixed top-4 left-4 z-30 px-3 py-1 bg-black/50 backdrop-blur-sm text-white text-xs rounded border border-white/20 hover:bg-black/70 transition-colors"
          aria-label="Open performance settings"
        >
          Perf: {level}
        </button>
      )}
      
      {/* Performance selector modal */}
      {show && (
        <a.div style={{opacity: springs.opacity as any}} className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center text-white z-40">
          <div className="bg-gray-800 p-4 rounded flex gap-2">
            <div className="text-sm mb-2">Choose performance level:</div>
            <div className="flex gap-2">
              {(['low','medium','high'] as PerfLevel[]).map(l => (
                <button key={l} onClick={() => choose(l)} className={`px-3 py-1 rounded ${level===l? 'bg-blue-500':'bg-gray-600'}`}>{l}</button>
              ))}
            </div>
          </div>
        </a.div>
      )}
    </>
  )
}
