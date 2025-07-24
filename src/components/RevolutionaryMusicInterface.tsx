/**
 * 🚀 REVOLUTIONARY MUSIC INTERFACE
 * 
 * This is the command center that unifies all revolutionary systems:
 * - Spatial Audio Engine
 * - Gesture-Based Composition  
 * - Neural Music Visualization
 * - Real-time AI Collaboration
 * 
 * The interface that makes Johnny Ive, Steve Jobs, and Elon Musk proud.
 */

'use client'
import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// Import our revolutionary systems
import { spatialAudioEngine } from '../lib/spatialAudioEngine'
import { gestureComposer, type MusicalGesture } from '../lib/gestureComposer'
import { neuralMusicVisualizer } from '../lib/neuralMusicVisualizer'

interface RevolutionaryMusicInterfaceProps {
  isActive: boolean
  onGestureComposed?: (gesture: MusicalGesture) => void
  onNeuralActivation?: (neuronId: string, intensity: number) => void
  className?: string
}

// 3D Scene component that handles all the visual magic
function RevolutionaryScene() {
  const { scene, camera } = useThree()
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Initialize all systems
  useEffect(() => {
    const initializeSystems = async () => {
      try {
        console.log('🚀 Initializing Revolutionary Systems...')
        
        // Initialize spatial audio engine
        const spatialSuccess = await spatialAudioEngine.initialize()
        console.log('🔊 Spatial Audio Engine:', spatialSuccess ? '✅' : '❌')
        
        // Initialize neural visualizer with the Three.js scene
        const neuralSuccess = await neuralMusicVisualizer.initialize(scene)
        console.log('🧠 Neural Visualizer:', neuralSuccess ? '✅' : '❌')
        
        if (spatialSuccess && neuralSuccess) {
          setIsInitialized(true)
          console.log('🎉 All Revolutionary Systems Online!')
        }
        
      } catch (error) {
        console.error('Failed to initialize revolutionary systems:', error)
      }
    }
    
    initializeSystems()
  }, [scene])

  // Update camera position for spatial audio
  useFrame((state) => {
    if (isInitialized) {
      // Update listener position for spatial audio
      spatialAudioEngine.updateListenerPosition(
        camera.position,
        new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
      )
      
      // Update neural visualization
      neuralMusicVisualizer.update(state.clock.getDelta())
    }
  })

  return null // The systems add their own objects to the scene
}

// Main interface component
export default function RevolutionaryMusicInterface({
  isActive,
  onGestureComposed,
  onNeuralActivation,
  className = ""
}: RevolutionaryMusicInterfaceProps) {
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gestureAnalytics, setGestureAnalytics] = useState({
    totalGestures: 0,
    gestureTypes: {},
    averageComplexity: 0,
    musicalRange: { min: 0, max: 0 }
  })
  
  const [neuralAnalytics, setNeuralAnalytics] = useState({
    totalNeurons: 0,
    totalConnections: 0,
    averageActivation: 0,
    networkComplexity: 0,
    harmonicCenters: []
  })

  const [isGestureMode, setIsGestureMode] = useState(false)
  const [spatialSources, setSpatialSources] = useState<Array<{
    id: string
    position: { x: number, y: number, z: number }
    type: string
    intensity: number
  }>>([])

  // Initialize gesture composer when canvas is ready
  useEffect(() => {
    if (canvasRef.current && isActive) {
      const success = gestureComposer.initialize(canvasRef.current)
      console.log('🎭 Gesture Composer:', success ? '✅' : '❌')
    }
  }, [canvasRef.current, isActive])

  // Listen for gesture events
  useEffect(() => {
    const handleGestureComposed = (event: CustomEvent) => {
      const gesture = event.detail.gesture
      console.log('🎵 Gesture composed:', gesture.type)
      
      // Update analytics
      setGestureAnalytics(gestureComposer.getGestureAnalytics())
      
      // Callback to parent
      onGestureComposed?.(gesture)
    }

    const handleSpatialAudioTriggered = (event: CustomEvent) => {
      const { id, position, type, visualEffect } = event.detail
      
      // Activate corresponding neuron
      neuralMusicVisualizer.activateNeuron({
        midiNote: 60, // Default to middle C, could be more sophisticated
        velocity: visualEffect.intensity || 0.8,
        frequency: 261.63,
        position: new THREE.Vector3(position.x, position.y, position.z)
      })
      
      // Update spatial sources list
      setSpatialSources(prev => [...prev.filter(s => s.id !== id), {
        id,
        position,
        type,
        intensity: visualEffect.intensity || 0.8
      }])
      
      // Update neural analytics
      setNeuralAnalytics(neuralMusicVisualizer.getNeuralAnalytics())
    }

    const handleNeuralActivation = (event: CustomEvent) => {
      const { neuronId, intensity } = event.detail
      onNeuralActivation?.(neuronId, intensity)
    }

    // Add event listeners
    document.addEventListener('gesture-composed', handleGestureComposed as EventListener)
    document.addEventListener('spatial-audio-triggered', handleSpatialAudioTriggered as EventListener)
    document.addEventListener('neural-activation', handleNeuralActivation as EventListener)

    return () => {
      document.removeEventListener('gesture-composed', handleGestureComposed as EventListener)
      document.removeEventListener('spatial-audio-triggered', handleSpatialAudioTriggered as EventListener)
      document.removeEventListener('neural-activation', handleNeuralActivation as EventListener)
    }
  }, [onGestureComposed, onNeuralActivation])

  // Create spatial audio source at clicked position
  const handleCanvasClick = useCallback(async (event: React.MouseEvent) => {
    if (!isActive) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    // Convert 2D click to 3D position
    const position = new THREE.Vector3(x * 20, y * 10, -5)
    
    // Create spatial audio source
    const sourceId = `click_${Date.now()}`
    const source = await spatialAudioEngine.createSpatialSource(
      sourceId,
      position,
      'note',
      {
        frequency: 440 + Math.random() * 440, // Random frequency
        waveform: 'sine'
      }
    )
    
    if (source) {
      // Play the spatial sound
      await spatialAudioEngine.playSpatialSound(
        sourceId,
        'C4',
        '4n',
        { velocity: 0.8 }
      )
      
      // Clean up after 2 seconds
      setTimeout(() => {
        spatialAudioEngine.removeSpatialSource(sourceId)
      }, 2000)
    }
  }, [isActive])

  if (!isActive) {
    return (
      <div className={`${className} flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-xl`}>
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🚀</div>
          <h2 className="text-2xl font-bold text-white mb-2">Revolutionary Mode</h2>
          <p className="text-white/70">Activate to unlock the future of music creation</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className} relative bg-black/20 backdrop-blur-xl rounded-xl overflow-hidden`}>
      
      {/* Revolutionary Controls Header */}
      <div className="absolute top-4 left-4 right-4 z-10 bg-black/50 backdrop-blur-sm rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-2xl">🚀</div>
            <div>
              <h3 className="text-white font-bold">Revolutionary Music Interface</h3>
              <p className="text-white/70 text-sm">Spatial Audio • Neural Visualization • Gesture Composition</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsGestureMode(!isGestureMode)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isGestureMode 
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              🎭 Gesture Mode
            </button>
          </div>
        </div>
      </div>

      {/* Main 3D Canvas */}
      <div className="w-full h-full relative">
        <Canvas
          ref={canvasRef}
          camera={{ position: [0, 5, 20], fov: 50 }}
          className="w-full h-full cursor-none"
          onClick={handleCanvasClick}
        >
          <ambientLight intensity={0.3} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#00ffff" />
          
          <RevolutionaryScene />
        </Canvas>
        
        {/* Gesture Mode Overlay */}
        {isGestureMode && (
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-cyan-900/20 pointer-events-none">
            <div className="absolute bottom-4 left-4 text-white">
              <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3">
                <p className="text-sm">🎭 <strong>Gesture Mode Active</strong></p>
                <p className="text-xs text-white/70">Draw patterns to create music</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Analytics Sidebar */}
      <div className="absolute bottom-4 right-4 z-10 bg-black/50 backdrop-blur-sm rounded-lg p-4 w-64">
        <h4 className="text-white font-bold mb-3">🧠 System Analytics</h4>
        
        {/* Neural Network Stats */}
        <div className="mb-4">
          <h5 className="text-cyan-400 text-sm font-medium mb-1">Neural Network</h5>
          <div className="space-y-1 text-xs text-white/70">
            <div>Neurons: {neuralAnalytics.totalNeurons}</div>
            <div>Connections: {neuralAnalytics.totalConnections}</div>
            <div>Avg Activation: {(neuralAnalytics.averageActivation * 100).toFixed(1)}%</div>
            <div>Complexity: {(neuralAnalytics.networkComplexity * 100).toFixed(1)}%</div>
          </div>
        </div>

        {/* Gesture Analytics */}
        <div className="mb-4">
          <h5 className="text-purple-400 text-sm font-medium mb-1">Gesture Analysis</h5>
          <div className="space-y-1 text-xs text-white/70">
            <div>Total Gestures: {gestureAnalytics.totalGestures}</div>
            <div>Avg Complexity: {gestureAnalytics.averageComplexity.toFixed(1)}</div>
            <div>Range: {gestureAnalytics.musicalRange.min}-{gestureAnalytics.musicalRange.max}</div>
          </div>
        </div>

        {/* Active Spatial Sources */}
        <div>
          <h5 className="text-yellow-400 text-sm font-medium mb-1">Spatial Audio</h5>
          <div className="text-xs text-white/70">
            Active Sources: {spatialSources.length}
          </div>
          {spatialSources.slice(0, 3).map(source => (
            <div key={source.id} className="text-xs text-white/50">
              {source.type} • {(source.intensity * 100).toFixed(0)}%
            </div>
          ))}
        </div>
      </div>

      {/* Performance Indicator */}
      <div className="absolute top-4 right-4 z-20">
        <div className="bg-green-500/20 backdrop-blur-sm rounded-full p-2">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="absolute bottom-4 left-4 z-10 bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white text-sm max-w-xs">
        <p><strong>🎵 Click:</strong> Create spatial audio</p>
        <p><strong>🎭 Draw:</strong> Gesture composition</p>  
        <p><strong>🧠 Watch:</strong> Neural activation</p>
      </div>
    </div>
  )
}

export type { RevolutionaryMusicInterfaceProps }