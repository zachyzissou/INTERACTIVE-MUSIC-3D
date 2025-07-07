// src/components/PerformanceAnalytics.tsx
'use client'
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getAnalyserBands } from '../lib/analyser'
import { useObjects } from '../store/useObjects'
import { useLoops } from '../store/useLoops'
import styles from './PerformanceAnalytics.module.css'

interface AnalyticsData {
  audioLevel: number
  bassLevel: number
  midLevel: number
  trebleLevel: number
  activeObjects: number
  activeLoops: number
  fps: number
  memoryUsage: number
}

export function PerformanceAnalytics() {
  const [isVisible, setIsVisible] = useState(false)
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    audioLevel: 0,
    bassLevel: 0,
    midLevel: 0,
    trebleLevel: 0,
    activeObjects: 0,
    activeLoops: 0,
    fps: 60,
    memoryUsage: 0
  })

  const objects = useObjects(state => state.objects)
  const loops = useLoops(state => state.active)

  useEffect(() => {
    let animationId: number
    let lastTime = performance.now()
    let frameCount = 0

    const updateAnalytics = () => {
      const now = performance.now()
      frameCount++

      // Calculate FPS every second
      if (now - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (now - lastTime))
        frameCount = 0
        lastTime = now

        // Get audio data
        const { bass, mid, treble } = getAnalyserBands()
        const audioLevel = (bass + mid + treble) / (3 * 255)

        // Get memory usage (if available)
        const memoryUsage = 'memory' in performance 
          ? (performance as any).memory?.usedJSHeapSize / 1048576 || 0
          : 0

        // Count active loops
        const activeLoops = Object.values(loops).filter(Boolean).length

        setAnalytics({
          audioLevel,
          bassLevel: bass / 255,
          midLevel: mid / 255,
          trebleLevel: treble / 255,
          activeObjects: objects.length,
          activeLoops,
          fps,
          memoryUsage
        })
      }

      animationId = requestAnimationFrame(updateAnalytics)
    }

    updateAnalytics()

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [objects.length, loops])

  const getPerformanceColor = (value: number, threshold: number) => {
    if (value > threshold) return 'text-red-400'
    if (value > threshold * 0.7) return 'text-yellow-400'
    return 'text-green-400'
  }

  const formatValue = (value: number, unit = '') => {
    return `${value.toFixed(1)}${unit}`
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 bg-black/60 hover:bg-black/80 text-white p-2 rounded-lg backdrop-blur-sm border border-gray-600 transition-colors"
        aria-label="Toggle performance analytics"
      >
        📊
      </button>

      {/* Analytics panel */}
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ 
          opacity: isVisible ? 1 : 0, 
          x: isVisible ? 0 : 300 
        }}
        transition={{ duration: 0.3 }}
        className="fixed top-4 right-4 z-40 bg-black/90 backdrop-blur-md text-white p-4 rounded-lg border border-purple-500/30 min-w-[280px] font-mono text-sm"
        style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Performance
          </h3>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close analytics"
          >
            ✕
          </button>
        </div>

        {/* Audio Levels */}
        <div className="space-y-2 mb-4">
          <h4 className="text-sm font-semibold text-gray-300">Audio Levels</h4>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Overall:</span>
            <div className="flex items-center space-x-2">
              <div className={styles.progressBar}>
                <div 
                  className={`${styles.progressFill} ${styles.audioProgressFill}`}
                  style={{ width: `${analytics.audioLevel * 100}%` }}
                />
              </div>
              <span className={getPerformanceColor(analytics.audioLevel, 0.8)}>
                {formatValue(analytics.audioLevel * 100, '%')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <div className="text-xs text-gray-400">Bass</div>
              <div className={`text-sm ${getPerformanceColor(analytics.bassLevel, 0.9)}`}>
                {formatValue(analytics.bassLevel * 100)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400">Mid</div>
              <div className={`text-sm ${getPerformanceColor(analytics.midLevel, 0.9)}`}>
                {formatValue(analytics.midLevel * 100)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400">Treble</div>
              <div className={`text-sm ${getPerformanceColor(analytics.trebleLevel, 0.9)}`}>
                {formatValue(analytics.trebleLevel * 100)}
              </div>
            </div>
          </div>
        </div>

        {/* System Performance */}
        <div className="space-y-2 mb-4">
          <h4 className="text-sm font-semibold text-gray-300">System</h4>
          
          <div className="flex justify-between">
            <span className="text-gray-400">FPS:</span>
            <span className={getPerformanceColor(60 - analytics.fps, 15)}>
              {analytics.fps}
            </span>
          </div>

          {analytics.memoryUsage > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-400">Memory:</span>
              <span className={getPerformanceColor(analytics.memoryUsage, 100)}>
                {formatValue(analytics.memoryUsage, 'MB')}
              </span>
            </div>
          )}
        </div>

        {/* Musical Activity */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-300">Musical Activity</h4>
          
          <div className="flex justify-between">
            <span className="text-gray-400">Objects:</span>
            <span className={getPerformanceColor(analytics.activeObjects, 50)}>
              {analytics.activeObjects}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Active Loops:</span>
            <span className={getPerformanceColor(analytics.activeLoops, 10)}>
              {analytics.activeLoops}
            </span>
          </div>
        </div>

        {/* Performance Tips */}
        {(analytics.fps < 45 || analytics.memoryUsage > 150 || analytics.activeObjects > 30) && (
          <div className="mt-4 p-2 bg-yellow-500/20 border border-yellow-500/50 rounded text-xs">
            <div className="font-semibold text-yellow-300 mb-1">Performance Tips:</div>
            {analytics.fps < 45 && <div>• Reduce visual effects or objects</div>}
            {analytics.memoryUsage > 150 && <div>• Clear unused audio objects</div>}
            {analytics.activeObjects > 30 && <div>• Consider fewer simultaneous objects</div>}
          </div>
        )}
      </motion.div>
    </>
  )
}

export default PerformanceAnalytics
