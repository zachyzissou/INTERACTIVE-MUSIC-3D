'use client'
import React, { useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useArtisticPerformance, QualityLevel, qualitySettings, performanceUtils } from '../lib/artisticPerformance'

// Performance metrics display
function MetricsDisplay({ metrics }: { metrics: any }) {
  if (!metrics) return null
  
  const bottlenecks = performanceUtils.analyzeBottlenecks(metrics)
  
  return (
    <div style={{
      fontSize: '11px',
      fontFamily: 'monospace',
      lineHeight: '1.4'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <div>
          <div style={{ color: metrics.fps < 30 ? '#ef4444' : metrics.fps < 50 ? '#f59e0b' : '#10b981' }}>
            FPS: {metrics.fps.toFixed(1)}
          </div>
          <div style={{ color: metrics.frameTime > 33 ? '#ef4444' : '#94a3b8' }}>
            Frame: {metrics.frameTime.toFixed(1)}ms
          </div>
          <div style={{ color: '#94a3b8' }}>
            Draws: {metrics.drawCalls}
          </div>
        </div>
        
        <div>
          <div style={{ color: '#94a3b8' }}>
            Tris: {(metrics.triangles / 1000).toFixed(0)}k
          </div>
          <div style={{ color: '#94a3b8' }}>
            Geom: {metrics.geometries}
          </div>
          <div style={{ color: '#94a3b8' }}>
            Tex: {metrics.textures}
          </div>
        </div>
      </div>
      
      <div style={{
        fontSize: '10px',
        color: '#94a3b8',
        marginBottom: '8px'
      }}>
        GPU: {(metrics.gpuMemory / 1024 / 1024).toFixed(1)}MB
      </div>
      
      {bottlenecks.length > 0 && (
        <div style={{
          fontSize: '10px',
          color: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          padding: '4px',
          borderRadius: '4px',
          border: '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          ⚠️ Issues:
          {bottlenecks.map((issue: string, i: number) => (
            <div key={i} style={{ marginTop: '2px' }}>
              • {issue}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Quality control panel
function QualityControls() {
  const { currentQuality, setQuality, setTargetFPS } = useArtisticPerformance()
  const [targetFPS, setLocalTargetFPS] = useState(30)
  
  const handleQualityChange = (quality: QualityLevel) => {
    setQuality(quality)
  }
  
  const handleTargetFPSChange = (fps: number) => {
    setLocalTargetFPS(fps)
    setTargetFPS(fps)
  }
  
  const currentSettings = qualitySettings[currentQuality]
  
  return (
    <div style={{
      fontSize: '11px',
      marginTop: '12px'
    }}>
      <div style={{
        marginBottom: '8px',
        fontSize: '12px',
        fontWeight: '600',
        color: '#4ade80'
      }}>
        Quality Controls
      </div>
      
      {/* Quality Level Selector */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ marginBottom: '4px', color: '#94a3b8' }}>Level:</div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '2px'
        }}>
          {[QualityLevel.LOW, QualityLevel.MEDIUM, QualityLevel.HIGH, QualityLevel.ULTRA].map((level) => (
            <button
              key={level}
              onClick={() => handleQualityChange(level)}
              style={{
                padding: '4px 2px',
                fontSize: '9px',
                background: currentQuality === level 
                  ? 'rgba(59, 130, 246, 0.3)' 
                  : 'rgba(255, 255, 255, 0.1)',
                border: `1px solid ${currentQuality === level ? '#3b82f6' : 'rgba(255, 255, 255, 0.2)'}`,
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {QualityLevel[level]}
            </button>
          ))}
        </div>
      </div>
      
      {/* Target FPS */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ marginBottom: '4px', color: '#94a3b8' }}>Target FPS:</div>
        <input
          type="range"
          min="15"
          max="60"
          step="15"
          value={targetFPS}
          onChange={(e) => handleTargetFPSChange(parseInt(e.target.value))}
          style={{
            width: '100%',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '2px',
            outline: 'none',
            appearance: 'none'
          }}
        />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontSize: '9px', 
          color: '#94a3b8',
          marginTop: '2px'
        }}>
          <span>15</span>
          <span>{targetFPS}</span>
          <span>60</span>
        </div>
      </div>
      
      {/* Current Settings Summary */}
      <div style={{
        fontSize: '9px',
        color: '#94a3b8',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        padding: '4px',
        borderRadius: '4px',
        marginTop: '8px'
      }}>
        <div>Complexity: {(currentSettings.shaderComplexity * 100).toFixed(0)}%</div>
        <div>Particles: {(currentSettings.particleDensity * 100).toFixed(0)}%</div>
        <div>Shadows: {currentSettings.shadowMapSize}px</div>
        <div>Effects: {currentSettings.postProcessing ? 'On' : 'Off'}</div>
      </div>
    </div>
  )
}

// FPS Graph component
function FPSGraph({ metrics }: { metrics: any[] }) {
  const maxSamples = 60
  const recentMetrics = metrics.slice(-maxSamples)
  
  if (recentMetrics.length < 2) return null
  
  const maxFPS = 60
  const graphHeight = 40
  const graphWidth = 120
  
  const points = recentMetrics.map((metric, index) => {
    const x = (index / (maxSamples - 1)) * graphWidth
    const y = graphHeight - (metric.fps / maxFPS) * graphHeight
    return `${x},${y}`
  }).join(' ')
  
  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ 
        fontSize: '10px', 
        color: '#94a3b8', 
        marginBottom: '4px' 
      }}>
        FPS History
      </div>
      <svg
        width={graphWidth}
        height={graphHeight}
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '4px'
        }}
      >
        {/* Grid lines */}
        {[15, 30, 45, 60].map(fps => {
          const y = graphHeight - (fps / maxFPS) * graphHeight
          return (
            <line
              key={fps}
              x1={0}
              y1={y}
              x2={graphWidth}
              y2={y}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth={1}
            />
          )
        })}
        
        {/* FPS line */}
        <polyline
          points={points}
          fill="none"
          stroke="#4ade80"
          strokeWidth={2}
        />
        
        {/* Target FPS line */}
        <line
          x1={0}
          y1={graphHeight - (30 / maxFPS) * graphHeight}
          x2={graphWidth}
          y2={graphHeight - (30 / maxFPS) * graphHeight}
          stroke="#ef4444"
          strokeWidth={1}
          strokeDasharray="3,3"
        />
      </svg>
    </div>
  )
}

// Export functionality
function ExportControls() {
  const { monitor } = useArtisticPerformance()
  
  const handleExport = () => {
    const metrics = monitor.getMetrics()
    const report = performanceUtils.exportReport(metrics)
    
    const blob = new Blob([report], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-report-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  return (
    <div style={{ marginTop: '12px' }}>
      <button
        onClick={handleExport}
        style={{
          width: '100%',
          padding: '6px',
          fontSize: '10px',
          background: 'rgba(59, 130, 246, 0.2)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '4px',
          color: 'white',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'
        }}
      >
        📊 Export Report
      </button>
    </div>
  )
}

// Component that runs inside Canvas to handle monitoring
export function PerformanceMonitor() {
  const { 
    isMonitoring, 
    updateMetrics,
    monitor,
    setMetricsArray
  } = useArtisticPerformance()
  
  // Update metrics on each frame
  useFrame(({ gl }) => {
    if (isMonitoring) {
      updateMetrics(gl)
      
      // Update metrics array for graph
      const metrics = monitor.getMetrics()
      setMetricsArray(metrics)
    }
  })
  
  return null // This component doesn't render anything
}

// Main performance debug panel UI (rendered outside Canvas)
export default function PerformanceDebugPanel() {
  const { 
    showDebugPanel, 
    toggleDebugPanel, 
    isMonitoring, 
    startMonitoring, 
    currentMetrics,
    allMetrics
  } = useArtisticPerformance()
  
  // Start monitoring when component mounts
  useEffect(() => {
    if (!isMonitoring) {
      startMonitoring()
    }
  }, [isMonitoring, startMonitoring])
  
  // Keyboard shortcut to toggle panel
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'p' && e.ctrlKey) {
        e.preventDefault()
        toggleDebugPanel()
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [toggleDebugPanel])
  
  if (!showDebugPanel) {
    return (
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        fontSize: '10px',
        color: 'rgba(255, 255, 255, 0.5)',
        zIndex: 1000,
        pointerEvents: 'none'
      }}>
        Ctrl+P for performance panel
      </div>
    )
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '20px',
      width: '200px',
      background: 'rgba(0, 0, 0, 0.9)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      padding: '12px',
      color: 'white',
      fontSize: '12px',
      fontFamily: 'system-ui, sans-serif',
      zIndex: 2000,
      maxHeight: '80vh',
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        paddingBottom: '8px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          fontSize: '13px',
          fontWeight: '600',
          color: '#4ade80'
        }}>
          🎨 Performance
        </div>
        <button
          onClick={toggleDebugPanel}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            padding: '2px 6px',
            color: 'white',
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
      </div>
      
      {/* Metrics Display */}
      <MetricsDisplay metrics={currentMetrics} />
      
      {/* FPS Graph */}
      <FPSGraph metrics={allMetrics || []} />
      
      {/* Quality Controls */}
      <QualityControls />
      
      {/* Export Controls */}
      <ExportControls />
      
      {/* Keyboard shortcuts */}
      <div style={{
        marginTop: '12px',
        fontSize: '9px',
        color: 'rgba(255, 255, 255, 0.5)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        paddingTop: '8px'
      }}>
        Ctrl+P: Toggle panel
      </div>
    </div>
  )
}