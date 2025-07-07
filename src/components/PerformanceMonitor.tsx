'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { logger } from '@/lib/logger'

interface PerformanceStats {
  fps: number
  memory: number
  objects: number
  draws: number
  frameTime: number
  renderCalls: number
}

interface PerformanceThreshold {
  fps: { good: number; warning: number }
  memory: { good: number; warning: number }
  frameTime: { good: number; warning: number }
}

const THRESHOLDS: PerformanceThreshold = {
  fps: { good: 50, warning: 30 },
  memory: { good: 50, warning: 100 }, // MB
  frameTime: { good: 16, warning: 33 } // ms
}

export function PerformanceMonitor() {
  const [stats, setStats] = useState<PerformanceStats>({
    fps: 0,
    memory: 0,
    objects: 0,
    draws: 0,
    frameTime: 0,
    renderCalls: 0
  })
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()
    let animationId: number
    let frameTimes: number[] = []

    const updateStats = () => {
      frameCount++
      const now = performance.now()
      const deltaTime = now - lastTime
      
      frameTimes.push(deltaTime)
      if (frameTimes.length > 60) frameTimes.shift() // Keep last 60 frames
      
      if (deltaTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / deltaTime)
        const memory = (performance as any).memory?.usedJSHeapSize 
          ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)
          : 0
        const avgFrameTime = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length

        setStats(prev => ({
          ...prev,
          fps,
          memory,
          frameTime: Math.round(avgFrameTime * 100) / 100,
          renderCalls: prev.renderCalls + frameCount
        }))

        frameCount = 0
        lastTime = now
        frameTimes = []
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
        if (process.env.NODE_ENV === 'development') {
          logger.info('Performance monitor toggled')
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  const getStatusColor = (value: number, type: keyof PerformanceThreshold): string => {
    const threshold = THRESHOLDS[type]
    
    let isGood: boolean
    let isWarning: boolean
    
    if (type === 'frameTime' || type === 'memory') {
      // Lower is better for frameTime and memory
      isGood = value <= threshold.good
      isWarning = value <= threshold.warning
    } else {
      // Higher is better for FPS
      isGood = value >= threshold.good
      isWarning = value >= threshold.warning
    }
    
    if (isGood) return 'text-green-400'
    if (isWarning) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getPerformanceGrade = (): { grade: string; color: string } => {
    const fpsGood = stats.fps >= THRESHOLDS.fps.good
    const memoryGood = stats.memory <= THRESHOLDS.memory.good
    const frameTimeGood = stats.frameTime <= THRESHOLDS.frameTime.good
    
    const goodCount = [fpsGood, memoryGood, frameTimeGood].filter(Boolean).length
    
    if (goodCount === 3) return { grade: 'A', color: 'text-green-400' }
    if (goodCount === 2) return { grade: 'B', color: 'text-yellow-400' }
    if (goodCount === 1) return { grade: 'C', color: 'text-orange-400' }
    return { grade: 'D', color: 'text-red-400' }
  }

  const performanceGrade = getPerformanceGrade()

  if (!visible) return null

  return (
    <div className="fixed top-4 right-4 z-50">
      <button 
        onClick={() => setVisible(!visible)}
        className="mb-2 px-3 py-1 bg-black/50 backdrop-blur-sm text-white text-xs rounded border border-white/20 hover:bg-black/70 transition-colors"
      >
        Perf: {performanceGrade.grade} {visible ? '−' : '+'}
      </button>
      
      {visible && (
        <div className="bg-black/80 backdrop-blur-sm text-white text-xs p-3 rounded border border-white/20 min-w-[200px] space-y-2">
          <div className="flex justify-between items-center border-b border-white/20 pb-2">
            <span className="font-semibold">Performance Monitor</span>
            <span className={`font-bold ${performanceGrade.color}`}>Grade: {performanceGrade.grade}</span>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>FPS:</span>
              <span className={getStatusColor(stats.fps, 'fps')}>{stats.fps}</span>
            </div>
            <div className="flex justify-between">
              <span>Frame Time:</span>
              <span className={getStatusColor(stats.frameTime, 'frameTime')}>{stats.frameTime}ms</span>
            </div>
            <div className="flex justify-between">
              <span>Memory:</span>
              <span className={getStatusColor(stats.memory, 'memory')}>{stats.memory}MB</span>
            </div>
            <div className="flex justify-between">
              <span>Render Calls:</span>
              <span className="text-gray-300">{stats.renderCalls.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="text-[10px] text-gray-400 border-t border-white/20 pt-2">
            <div>Good FPS: ≥{THRESHOLDS.fps.good}</div>
            <div>Good Memory: ≤{THRESHOLDS.memory.good}MB</div>
            <div>Good Frame Time: ≤{THRESHOLDS.frameTime.good}ms</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PerformanceMonitor
