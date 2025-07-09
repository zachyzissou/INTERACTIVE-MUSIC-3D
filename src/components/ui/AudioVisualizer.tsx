'use client'

import React, { useEffect, useRef } from 'react'

interface AudioData {
  bass: number
  mid: number
  high: number
  volume: number
  spectrum: Float32Array
}

interface AudioVisualizerProps {
  audioData: AudioData
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ audioData }) => {
  const barsRef = useRef<HTMLDivElement[]>([])
  
  useEffect(() => {
    // Update heights via direct DOM manipulation to avoid inline styles
    barsRef.current.forEach((bar, i) => {
      if (bar) {
        const height = Math.max(4, (audioData.spectrum?.[i] || Math.random() * 0.3) * 40)
        bar.style.height = `${height}px`
      }
    })
  }, [audioData.spectrum])

  return (
    <div className="god-tier-audio-visualizer">
      <div className="flex space-x-1">
        {Array.from({ length: 16 }, (_, i) => (
          <div
            key={`spectrum-bar-${i}`}
            ref={(el) => {
              if (el) barsRef.current[i] = el
            }}
            className="god-tier-spectrum-bar"
          />
        ))}
      </div>
      <div className="text-xs text-gray-300">
        <div>B: {Math.round(audioData.bass * 100)}</div>
        <div>M: {Math.round(audioData.mid * 100)}</div>
        <div>H: {Math.round(audioData.high * 100)}</div>
      </div>
    </div>
  )
}

export default AudioVisualizer