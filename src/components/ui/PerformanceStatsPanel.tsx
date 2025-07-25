'use client'
import { useState, useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useAudioStore } from '@/store/useAudioEngine'
import { useObjects } from '@/store/useObjects'
import FloatingPanel from './FloatingPanel'
import LiquidButton from '../LiquidButton'

interface PerformanceStatsPanelProps {
  position?: [number, number, number]
  orbitRadius?: number
  orbitSpeed?: number
  theme?: 'cyber' | 'glass' | 'neon' | 'plasma'
  onClose?: () => void
}

interface PerformanceStats {
  fps: number
  drawCalls: number
  triangles: number
  memoryUsage: number
  audioLatency: number
  activeObjects: number
  particleCount: number
}

export default function PerformanceStatsPanel({
  position = [0, -1.5, -3],
  orbitRadius = 0,
  orbitSpeed = 0,
  theme = 'glass',
  onClose
}: PerformanceStatsPanelProps) {
  const { gl } = useThree()
  const { fftData } = useAudioStore()
  const objects = useObjects(s => s.objects)
  
  const [stats, setStats] = useState<PerformanceStats>({
    fps: 0,
    drawCalls: 0,
    triangles: 0,
    memoryUsage: 0,
    audioLatency: 0,
    activeObjects: 0,
    particleCount: 0
  })
  
  const [isRecording, setIsRecording] = useState(false)
  const [history, setHistory] = useState<number[]>([])
  const frameTimeRef = useRef<number[]>([])
  const lastTimeRef = useRef(performance.now())

  // Update stats every frame
  useFrame(() => {
    const now = performance.now()
    const deltaTime = now - lastTimeRef.current
    lastTimeRef.current = now

    // Calculate FPS
    frameTimeRef.current.push(deltaTime)
    if (frameTimeRef.current.length > 60) {
      frameTimeRef.current.shift()
    }
    
    const avgFrameTime = frameTimeRef.current.reduce((a, b) => a + b, 0) / frameTimeRef.current.length
    const fps = Math.round(1000 / avgFrameTime)

    // Get WebGL stats
    const info = gl.info
    const memory = (gl as any).getExtension?.('WEBGL_debug_renderer_info')

    setStats(prev => ({
      ...prev,
      fps,
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      activeObjects: objects.length,
      audioLatency: fftData ? fftData.length / 44100 * 1000 : 0, // Rough estimate
      memoryUsage: (performance as any).memory?.usedJSHeapSize 
        ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)
        : 0
    }))

    // Record FPS history
    if (isRecording) {
      setHistory(prev => {
        const newHistory = [...prev, fps]
        return newHistory.length > 120 ? newHistory.slice(-120) : newHistory
      })
    }
  })

  const getPerformanceColor = (fps: number) => {
    if (fps >= 55) return '#00ff88' // Green
    if (fps >= 30) return '#ffaa00' // Orange
    return '#ff4444' // Red
  }

  const getPerformanceGrade = (fps: number) => {
    if (fps >= 55) return 'A'
    if (fps >= 45) return 'B'
    if (fps >= 30) return 'C'
    return 'D'
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    if (!isRecording) {
      setHistory([])
    }
  }

  const clearHistory = () => {
    setHistory([])
  }

  return (
    <FloatingPanel
      position={position}
      title="📊 Performance Monitor"
      theme={theme}
      orbitRadius={orbitRadius}
      orbitSpeed={orbitSpeed}
      onClose={onClose}
      className="max-w-[350px]"
    >
      <div className="space-y-4">
        {/* Main Performance Indicator */}
        <div className="text-center p-4 rounded-lg bg-white/5 border border-white/20">
          <div 
            className="text-4xl font-bold mb-2"
            style={{ color: getPerformanceColor(stats.fps) }}
          >
            {stats.fps} FPS
          </div>
          <div className="text-sm opacity-70">
            Grade: <span 
              className="font-bold text-lg"
              style={{ color: getPerformanceColor(stats.fps) }}
            >
              {getPerformanceGrade(stats.fps)}
            </span>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="space-y-2">
          <div className="text-sm font-semibold opacity-80">System Stats</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded bg-white/5">
              <div className="opacity-60">Draw Calls</div>
              <div className="font-bold">{stats.drawCalls}</div>
            </div>
            <div className="p-2 rounded bg-white/5">
              <div className="opacity-60">Triangles</div>
              <div className="font-bold">{stats.triangles.toLocaleString()}</div>
            </div>
            <div className="p-2 rounded bg-white/5">
              <div className="opacity-60">Memory (MB)</div>
              <div className="font-bold">{stats.memoryUsage}</div>
            </div>
            <div className="p-2 rounded bg-white/5">
              <div className="opacity-60">Objects</div>
              <div className="font-bold">{stats.activeObjects}</div>
            </div>
          </div>
        </div>

        {/* Audio Stats */}
        <div className="space-y-2">
          <div className="text-sm font-semibold opacity-80">Audio System</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded bg-white/5">
              <div className="opacity-60">Latency (ms)</div>
              <div className="font-bold">{Math.round(stats.audioLatency)}</div>
            </div>
            <div className="p-2 rounded bg-white/5">
              <div className="opacity-60">Buffer Size</div>
              <div className="font-bold">{fftData?.length || 0}</div>
            </div>
          </div>
        </div>

        {/* Performance Graph */}
        {history.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-semibold opacity-80">FPS History</div>
            <div className="h-16 bg-black/30 rounded-lg p-2 relative overflow-hidden">
              <svg className="w-full h-full">
                <polyline
                  fill="none"
                  stroke={getPerformanceColor(stats.fps)}
                  strokeWidth="1"
                  points={history.map((fps, i) => {
                    const x = (i / (history.length - 1)) * 100
                    const y = 100 - (fps / 60) * 100
                    return `${x},${y}`
                  }).join(' ')}
                />
              </svg>
              <div className="absolute top-1 right-1 text-xs opacity-50">60</div>
              <div className="absolute bottom-1 right-1 text-xs opacity-50">0</div>
            </div>
          </div>
        )}

        {/* Recording Controls */}
        <div className="flex gap-2">
          <LiquidButton
            onClick={toggleRecording}
            variant={isRecording ? 'accent' : 'secondary'}
            className="px-3 py-2 text-xs flex-1"
          >
            {isRecording ? '⏹️ Stop' : '⏺️ Record'}
          </LiquidButton>
          
          <LiquidButton
            onClick={clearHistory}
            variant="secondary"
            className="px-3 py-2 text-xs"
            disabled={history.length === 0}
          >
            🗑️ Clear
          </LiquidButton>
        </div>

        {/* Performance Recommendations */}
        <div className="pt-2 border-t border-white/20 text-xs">
          <div className="text-sm font-semibold opacity-80 mb-2">Recommendations</div>
          <div className="space-y-1 opacity-70">
            {stats.fps < 30 && (
              <div className="text-red-300">• Consider reducing visual effects</div>
            )}
            {stats.drawCalls > 100 && (
              <div className="text-yellow-300">• Too many draw calls detected</div>
            )}
            {stats.memoryUsage > 100 && (
              <div className="text-orange-300">• High memory usage detected</div>
            )}
            {stats.fps >= 55 && (
              <div className="text-green-300">• Performance is excellent!</div>
            )}
          </div>
        </div>

        {/* Device Info */}
        <div className="pt-2 border-t border-white/20 text-xs opacity-50">
          <div className="flex justify-between">
            <span>WebGL:</span>
            <span>{gl.capabilities.isWebGL2 ? 'WebGL2' : 'WebGL1'}</span>
          </div>
          <div className="flex justify-between">
            <span>Max Texture:</span>
            <span>{gl.capabilities.maxTextureSize}</span>
          </div>
          <div className="flex justify-between">
            <span>Vendor:</span>
            <span className="truncate ml-2">{gl.getParameter(gl.VENDOR)}</span>
          </div>
        </div>
      </div>
    </FloatingPanel>
  )
}