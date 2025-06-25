'use client'
import { useEffect, useState } from 'react'
import { usePerformanceSettings, PerfLevel } from '@/store/usePerformanceSettings'
import { a, useSpring } from '@react-spring/three'

export default function PerformanceSelector() {
  const [show, setShow] = useState(false)
  const setLevel = usePerformanceSettings(s => s.setLevel)
  const level = usePerformanceSettings(s => s.level)
  const [springs, api] = useSpring(() => ({ opacity: 1 }))
  useEffect(() => {
    const saved = localStorage.getItem('perf-level') as PerfLevel | null
    if (saved) {
      setLevel(saved)
    } else {
      setShow(true)
    }
  }, [setLevel])
  const choose = (lvl: PerfLevel) => {
    localStorage.setItem('perf-level', lvl)
    setLevel(lvl)
    api.start({ opacity: 0, onRest: () => setShow(false) })
  }
  if (!show) return null
  return (
    <a.div style={{opacity: springs.opacity as any}} className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center text-white z-50">
      <div className="bg-gray-800 p-4 rounded flex gap-2">
        {(['low','medium','high'] as PerfLevel[]).map(l => (
          <button key={l} onClick={() => choose(l)} className={`px-3 py-1 rounded ${level===l? 'bg-blue-500':'bg-gray-600'}`}>{l}</button>
        ))}
      </div>
    </a.div>
  )
}
