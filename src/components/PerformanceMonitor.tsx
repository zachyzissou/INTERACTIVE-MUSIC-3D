'use client'
import React, { useEffect, useState } from 'react'
import { logger } from '@/lib/logger'

interface PerformanceStats {
  fps: number
  memory: number
  objects: number
  draws: number
}

export function PerformanceMonitor() {
  const [stats, setStats] = useState<PerformanceStats>({
    fps: 0,
    memory: 0,
    objects: 0,
    draws: 0
  })
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()
    let animationId: number

    const updateStats = () => {
      frameCount++
      const now = performance.now()
      
      if (now - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (now - lastTime))
        const memory = (performance as any).memory?.usedJSHeapSize 
          ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)
          : 0

        setStats(prev => ({
          ...prev,
          fps,
          memory
        }))

        frameCount = 0
        lastTime = now
      }

      animationId = requestAnimationFrame(updateStats)
    }

    updateStats()

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [])

  // Toggle with Ctrl+Shift+P
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setVisible(prev => !prev)
        logger.info('Performance monitor toggled')
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed top-4 right-4 bg-black bg-opacity-80 text-white p-3 rounded text-sm font-mono z-50">
      <div className="text-green-400 font-bold mb-2">Performance Monitor</div>
      <div>FPS: <span className={stats.fps < 30 ? 'text-red-400' : 'text-green-400'}>{stats.fps}</span></div>
      <div>Memory: <span className={stats.memory > 100 ? 'text-orange-400' : 'text-green-400'}>{stats.memory}MB</span></div>
      <div>Objects: {stats.objects}</div>
      <div>Draws: {stats.draws}</div>
      <div className="text-gray-400 text-xs mt-2">Ctrl+Shift+P to hide</div>
    </div>
  )
}

export default PerformanceMonitor
