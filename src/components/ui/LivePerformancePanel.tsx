'use client'
import React, { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Activity, Zap, Monitor, Wifi, HardDrive, Cpu } from 'lucide-react'
import { useUIManager } from './UIManager'
import FloatingPanel from './FloatingPanel'

interface MetricCardProps {
  readonly label: string
  readonly value: string | number
  readonly unit?: string
  readonly icon: React.ComponentType<{ size: number }>
  readonly color: 'green' | 'yellow' | 'red' | 'blue'
  readonly trend?: 'up' | 'down' | 'stable'
}

function MetricCard({ label, value, unit = '', icon: Icon, color, trend }: MetricCardProps) {
  const getColorClasses = () => {
    switch (color) {
      case 'green': return 'from-emerald-500/20 to-green-500/20 border-emerald-500/30 text-emerald-400'
      case 'yellow': return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30 text-yellow-400'
      case 'red': return 'from-red-500/20 to-pink-500/20 border-red-500/30 text-red-400'
      case 'blue': return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400'
      default: return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400'
    }
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return '↗'
      case 'down': return '↘'
      case 'stable': return '→'
      default: return ''
    }
  }

  return (
    <div className={`p-4 rounded-xl bg-gradient-to-br border ${getColorClasses()}`}>
      <div className="flex items-center justify-between mb-2">
        <Icon size={20} />
        {trend && (
          <span className="text-sm font-mono">{getTrendIcon()}</span>
        )}
      </div>
      <div className="space-y-1">
        <div className="text-2xl font-bold font-mono">
          {value}{unit}
        </div>
        <div className="text-sm opacity-80">{label}</div>
      </div>
    </div>
  )
}

interface ChartProps {
  readonly data: number[]
  readonly color: string
  readonly height?: number
}

function MiniChart({ data, color, height = 60 }: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height: canvasHeight } = canvas
    const max = Math.max(...data, 1)
    const min = Math.min(...data)
    const range = max - min || 1

    ctx.clearRect(0, 0, width, canvasHeight)
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    for (let i = 0; i < 5; i++) {
      const y = (i / 4) * canvasHeight
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Draw line
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()

    data.forEach((value, index) => {
      const x = (index / (data.length - 1)) * width
      const y = canvasHeight - ((value - min) / range) * canvasHeight
      
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()

    // Fill area under line
    ctx.fillStyle = color.replace('rgb', 'rgba').replace(')', ', 0.2)')
    ctx.lineTo(width, canvasHeight)
    ctx.lineTo(0, canvasHeight)
    ctx.closePath()
    ctx.fill()
  }, [data, color])

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={height}
      className="w-full rounded"
    />
  )
}

export function LivePerformancePanel() {
  const { registerPanel, unregisterPanel, visiblePanels } = useUIManager()
  const [metrics, setMetrics] = useState({
    fps: 60,
    frameTime: 16.7,
    audioLatency: 12,
    cpuUsage: 45,
    memoryUsage: 68,
    drawCalls: 156,
  })
  
  const [fpsHistory, setFpsHistory] = useState<number[]>(Array(20).fill(60))
  const [memoryHistory, setMemoryHistory] = useState<number[]>(Array(20).fill(68))

  useEffect(() => {
    registerPanel({
      id: 'performancePanel',
      title: 'Live Performance Monitor',
      component: LivePerformancePanel,
      defaultPosition: { x: 50, y: 150 },
      defaultSize: { width: 400, height: 550 },
      variant: 'glass',
      isDraggable: true,
      isVisible: false,
    })

    return () => unregisterPanel('performancePanel')
  }, [registerPanel, unregisterPanel])

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time metrics (in a real app, these would come from actual performance APIs)
      const newMetrics = {
        fps: Math.floor(55 + Math.random() * 10),
        frameTime: 14 + Math.random() * 6,
        audioLatency: 8 + Math.random() * 8,
        cpuUsage: 40 + Math.random() * 20,
        memoryUsage: 60 + Math.random() * 20,
        drawCalls: 140 + Math.floor(Math.random() * 40),
      }
      
      setMetrics(newMetrics)
      
      setFpsHistory(prev => [...prev.slice(1), newMetrics.fps])
      setMemoryHistory(prev => [...prev.slice(1), newMetrics.memoryUsage])
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const isVisible = visiblePanels.has('performancePanel')

  if (!isVisible) return null

  return (
    <FloatingPanel
      title="Live Performance Monitor"
      variant="glass"
      defaultPosition={{ x: 50, y: 150 }}
      defaultSize={{ width: 400, height: 550 }}
      isVisible={isVisible}
      onVisibilityChange={(visible) => {
        if (!visible) {
          // Handle panel close through UI manager
        }
      }}
    >
      <div className="space-y-6">
        {/* Real-time Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            label="Frame Rate"
            value={metrics.fps}
            unit=" FPS"
            icon={Activity}
            color={metrics.fps > 55 ? 'green' : metrics.fps > 30 ? 'yellow' : 'red'}
            trend={metrics.fps > 55 ? 'stable' : 'down'}
          />
          <MetricCard
            label="Frame Time"
            value={metrics.frameTime.toFixed(1)}
            unit="ms"
            icon={Zap}
            color={metrics.frameTime < 20 ? 'green' : metrics.frameTime < 33 ? 'yellow' : 'red'}
          />
          <MetricCard
            label="Audio Latency"
            value={metrics.audioLatency.toFixed(0)}
            unit="ms"
            icon={Wifi}
            color={metrics.audioLatency < 20 ? 'green' : metrics.audioLatency < 50 ? 'yellow' : 'red'}
          />
          <MetricCard
            label="Draw Calls"
            value={metrics.drawCalls}
            icon={Monitor}
            color={metrics.drawCalls < 200 ? 'green' : metrics.drawCalls < 400 ? 'yellow' : 'red'}
          />
        </div>

        {/* Charts Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-white/90 flex items-center gap-2">
            <Activity size={16} />
            Performance Trends
          </h3>
          
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/80">FPS Over Time</span>
                <span className="text-xs font-mono text-emerald-400">{metrics.fps} FPS</span>
              </div>
              <MiniChart data={fpsHistory} color="rgb(34, 197, 94)" />
            </div>
            
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/80">Memory Usage</span>
                <span className="text-xs font-mono text-blue-400">{metrics.memoryUsage.toFixed(0)}%</span>
              </div>
              <MiniChart data={memoryHistory} color="rgb(59, 130, 246)" />
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white/90 flex items-center gap-2">
            <Cpu size={16} />
            System Resources
          </h3>
          
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-2">
                <Cpu size={16} className="text-blue-400" />
                <span className="text-sm">CPU Usage</span>
              </div>
              <span className="text-sm font-mono">{metrics.cpuUsage.toFixed(0)}%</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-2">
                <HardDrive size={16} className="text-purple-400" />
                <span className="text-sm">Memory Usage</span>
              </div>
              <span className="text-sm font-mono">{metrics.memoryUsage.toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Performance Status */}
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
          <div className="flex items-center gap-2 text-emerald-400 text-sm">
            <Activity size={14} />
            <span>System performing optimally</span>
          </div>
        </div>
      </div>
    </FloatingPanel>
  )
}

export default LivePerformancePanel
