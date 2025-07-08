'use client'
import React, { useRef, useEffect, useCallback, useState } from 'react'
import { gsap } from 'gsap'

interface AudioAnalyzerProps {
  onFrequencyData?: (data: Float32Array) => void
  onBassData?: (bass: number) => void
  onMidData?: (mid: number) => void
  onHighData?: (high: number) => void
  audioSource?: MediaElementAudioSourceNode | null
}

export function AudioAnalyzer({
  onFrequencyData,
  onBassData,
  onMidData,
  onHighData,
  audioSource
}: Readonly<AudioAnalyzerProps>) {
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Float32Array | null>(null)
  const animationRef = useRef<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isActive, setIsActive] = useState(false)

  // Initialize audio context and analyser
  useEffect(() => {
    if (!audioSource) return

    try {
      const audioContext = audioSource.context
      const analyser = audioContext.createAnalyser()
      
      // Configure analyser
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8
      
      // Connect audio source to analyser
      audioSource.connect(analyser)
      
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Float32Array(bufferLength)
      
      analyserRef.current = analyser
      dataArrayRef.current = dataArray
      setIsActive(true)

      // Start analysis loop
      const analyze = () => {
        if (!analyser || !dataArray) return

        analyser.getFloatFrequencyData(dataArray)
        
        // Calculate frequency band averages
        const bassRange = Math.floor(bufferLength * 0.1) // 0-10% for bass
        const midRange = Math.floor(bufferLength * 0.5) // 10-50% for mids
        const highRange = bufferLength // 50-100% for highs
        
        let bassSum = 0
        let midSum = 0
        let highSum = 0
        
        // Bass frequencies (roughly 20-250 Hz)
        for (let i = 0; i < bassRange; i++) {
          bassSum += dataArray[i]
        }
        const bassAvg = bassSum / bassRange
        
        // Mid frequencies (roughly 250-4000 Hz)
        for (let i = bassRange; i < midRange; i++) {
          midSum += dataArray[i]
        }
        const midAvg = midSum / (midRange - bassRange)
        
        // High frequencies (roughly 4000-20000 Hz)
        for (let i = midRange; i < highRange; i++) {
          highSum += dataArray[i]
        }
        const highAvg = highSum / (highRange - midRange)
        
        // Normalize values (from dB to 0-1 range)
        const normalizeBass = Math.max(0, (bassAvg + 60) / 60)
        const normalizeMid = Math.max(0, (midAvg + 60) / 60)
        const normalizeHigh = Math.max(0, (highAvg + 60) / 60)
        
        // Trigger callbacks
        onFrequencyData?.(dataArray)
        onBassData?.(normalizeBass)
        onMidData?.(normalizeMid)
        onHighData?.(normalizeHigh)
        
        // Update visualization
        updateVisualization(dataArray, normalizeBass, normalizeMid, normalizeHigh)
        
        animationRef.current = requestAnimationFrame(analyze)
      }

      analyze()

    } catch (error) {
      console.error('Failed to initialize audio analyzer:', error)
      setIsActive(false)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      setIsActive(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioSource, onFrequencyData, onBassData, onMidData, onHighData])

  // Update canvas visualization
  const updateVisualization = useCallback((
    dataArray: Float32Array,
    bass: number,
    mid: number,
    high: number
  ) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Clear canvas with fade effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
    ctx.fillRect(0, 0, width, height)

    // Draw frequency bars
    const barWidth = width / dataArray.length
    let x = 0

    for (let i = 0; i < dataArray.length; i++) {
      const barHeight = Math.max(0, (dataArray[i] + 60) / 60) * height

      // Color based on frequency range
      let hue
      if (i < dataArray.length * 0.1) {
        hue = 0 // Red for bass
      } else if (i < dataArray.length * 0.5) {
        hue = 120 // Green for mids
      } else {
        hue = 240 // Blue for highs
      }

      ctx.fillStyle = `hsl(${hue}, 70%, ${50 + barHeight / height * 50}%)`
      ctx.fillRect(x, height - barHeight, barWidth, barHeight)

      x += barWidth
    }

    // Draw frequency band indicators
    const bassRadius = bass * 30 + 5
    const midRadius = mid * 30 + 5
    const highRadius = high * 30 + 5

    // Bass circle (bottom left)
    ctx.beginPath()
    ctx.arc(40, height - 40, bassRadius, 0, 2 * Math.PI)
    ctx.fillStyle = `rgba(255, 0, 128, ${bass})`
    ctx.fill()

    // Mid circle (center)
    ctx.beginPath()
    ctx.arc(width / 2, height - 40, midRadius, 0, 2 * Math.PI)
    ctx.fillStyle = `rgba(0, 255, 128, ${mid})`
    ctx.fill()

    // High circle (bottom right)
    ctx.beginPath()
    ctx.arc(width - 40, height - 40, highRadius, 0, 2 * Math.PI)
    ctx.fillStyle = `rgba(128, 255, 255, ${high})`
    ctx.fill()

    // Add glow effects
    ctx.shadowBlur = 20
    ctx.shadowColor = `rgba(255, 0, 255, ${bass * 0.5})`
  }, [])

  return (
    <div className="audio-analyzer fixed top-4 right-4 z-40 bg-black/20 backdrop-blur-xl border border-white/20 rounded-xl p-4">
      <h4 className="text-white font-medium text-sm mb-2 text-center">
        Audio Analysis
      </h4>
      
      <canvas
        ref={canvasRef}
        width={200}
        height={100}
        className="w-full h-auto rounded-lg border border-white/10 bg-gradient-to-br from-purple-500/5 to-cyan-500/5"
      />
      
      <div className="mt-2 text-xs text-white/60 text-center">
        {isActive ? 'Analyzing audio...' : 'No audio source'}
      </div>
    </div>
  )
}

// Audio-reactive mesh hook for Three.js integration
export function useAudioReactiveMesh(
  meshRef: React.RefObject<any>,
  audioData: { bass: number; mid: number; high: number }
) {
  useEffect(() => {
    if (!meshRef.current) return

    const mesh = meshRef.current
    const { bass, mid, high } = audioData

    // Scale based on bass
    gsap.to(mesh.scale, {
      x: 1 + bass * 0.5,
      y: 1 + bass * 0.5,
      z: 1 + bass * 0.5,
      duration: 0.1,
      ease: "power2.out"
    })

    // Rotation based on mid frequencies
    gsap.to(mesh.rotation, {
      y: mesh.rotation.y + mid * 0.1,
      duration: 0.2,
      ease: "none"
    })

    // Color/material changes based on high frequencies
    if (mesh.material?.color) {
      gsap.to(mesh.material.color, {
        r: 0.5 + high * 0.5,
        g: 0.2 + mid * 0.8,
        b: 0.8 + bass * 0.2,
        duration: 0.3
      })
    }
  }, [meshRef, audioData])
}
