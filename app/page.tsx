"use client";
import React, { Suspense } from "react";
import dynamic from 'next/dynamic';
import PerformanceSelector from "@/components/PerformanceSelector";
import ExampleModal from "@/components/ExampleModal";
import StartOverlay from "@/components/StartOverlay";
import { CanvasErrorBoundary } from "@/components/CanvasErrorBoundary";
import { AudioErrorBoundary } from "@/components/AudioErrorBoundary";
import SafariCanvasDetector from "@/components/SafariCanvasDetector";
import PerformanceMonitor from "@/components/PerformanceMonitor";
import { startAudio } from "@/lib/engine";
import type { ShaderIconType } from "@/config/shaderConfigs";
import { shaderConfigurations } from "@/config/shaderConfigs";
import { LoadingSpinner, CanvasSkeleton, UISkeleton } from "@/components/LoadingSpinner";
import { getAnalyserBands, getFrequencyDataArray, subscribeToAudioLevel } from "@/lib/analyser";

// Dynamic imports for code splitting with enhanced loading states
const CanvasScene = dynamic(() => import('../src/components/CanvasScene'), { 
  ssr: false,
  loading: () => <CanvasSkeleton />
});

const DevCanvas = dynamic(() => import('../src/components/DevCanvas'), { 
  ssr: false,
  loading: () => <CanvasSkeleton />
});

// Lazy load UI components
const GodTierUI = dynamic(() => import("@/components/ui/GodTierUI"), {
  ssr: false,
  loading: () => <UISkeleton />
});

// Revolutionary Music Interface - the future of music creation
const RevolutionaryMusicInterface = dynamic(() => import("@/components/RevolutionaryMusicInterface"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-black/20 backdrop-blur-xl rounded-xl flex items-center justify-center">
      <LoadingSpinner message="Loading Revolutionary Systems..." size="large" variant="general" />
    </div>
  )
});

// Lazy load AI components only when needed
const MagentaMusicGenerator = dynamic(
  () => import('@/components/ui/MagentaMusicGenerator').then(mod => ({ default: mod.MagentaMusicGenerator })), 
  { 
    ssr: false,
    loading: () => (
      <div className="fixed bottom-4 right-4 z-40">
        <LoadingSpinner message="Loading AI Music Generator..." variant="audio" />
      </div>
    )
  }
);

const PerformanceAnalytics = dynamic(() => import("@/components/PerformanceAnalytics"), {
  ssr: false,
  loading: () => null
});

export default function Home() {
  const [Scene, setScene] = React.useState(() => CanvasScene)
  const [started, setStarted] = React.useState(false)
  const [showAnalytics, setShowAnalytics] = React.useState(false)
  const [isAudioInitialized, setIsAudioInitialized] = React.useState(false)
  const [initProgress, setInitProgress] = React.useState(0)
  // Audio reactive state
  // Real-time audio analysis data (replacing mock data)
  const [audioAnalysis, setAudioAnalysis] = React.useState({
    bass: 0,
    mid: 0,
    treble: 0,
    spectrum: new Float32Array(256), // Real spectrum data
    level: 0
  })
  const [volume, setVolume] = React.useState(1)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [activeShader, setActiveShader] = React.useState('metaball')
  const [glitchIntensity, setGlitchIntensity] = React.useState(0)
  
  // Revolutionary Mode State
  const [revolutionaryMode, setRevolutionaryMode] = React.useState(false)
  const [gestureStats, setGestureStats] = React.useState({ total: 0, types: {} })
  const [neuralActivity, setNeuralActivity] = React.useState(0)

  React.useEffect(() => {
    const useDev = new URLSearchParams(window.location.search).get('devcanvas') === '1'
    const showAnalytics = new URLSearchParams(window.location.search).get('analytics') === '1'
    const useRevolutionary = new URLSearchParams(window.location.search).get('revolutionary') === '1'
    
    if (useDev) setScene(() => DevCanvas)
    if (showAnalytics) setShowAnalytics(true)
    if (useRevolutionary) setRevolutionaryMode(true)
  }, [])

  // Set up real-time audio analysis (replaces mock data)  
  React.useEffect(() => {
    if (!isAudioInitialized) return

    let animationFrame: number
    const updateAudioAnalysis = () => {
      try {
        // Get real-time frequency analysis
        const bands = getAnalyserBands()
        const spectrum = getFrequencyDataArray()
        
        setAudioAnalysis(prev => ({
          bass: bands.bass / 255, // Normalize to 0-1
          mid: bands.mid / 255,
          treble: bands.treble / 255,
          spectrum: spectrum.length > 0 ? spectrum : prev.spectrum,
          level: (bands.bass + bands.mid + bands.treble) / (3 * 255)
        }))
        
        animationFrame = requestAnimationFrame(updateAudioAnalysis)
      } catch (error) {
        console.warn('Audio analysis update failed:', error)
        // Continue trying with fallback data
        animationFrame = requestAnimationFrame(updateAudioAnalysis)
      }
    }

    // Start real-time updates
    updateAudioAnalysis()

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [isAudioInitialized])

  const handleStart = React.useCallback(async () => {
    try {
      setInitProgress(25)
      const ok = await startAudio()
      setInitProgress(75)
      
      if (ok) {
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 500))
        setInitProgress(100)
        setIsAudioInitialized(true)
        setStarted(true)
      }
      return ok
    } catch (error) {
      console.error('Failed to start audio:', error)
      setInitProgress(0)
      return false
    }
  }, [])

  return (
    <AudioErrorBoundary>
    <div className="relative h-full w-full">
      <a href="#main-content" className="god-tier-skip-link">
        Skip to main content
      </a>
      {!started && (
        <StartOverlay 
          onFinish={handleStart} 
          progress={initProgress}
        />
      )}
      {started && (
        <>
          <main id="main-content" className="relative h-full w-full">
            <CanvasErrorBoundary>
              <SafariCanvasDetector>
                <Suspense fallback={<CanvasSkeleton />}>
                  <Scene />
                </Suspense>
              </SafariCanvasDetector>
            </CanvasErrorBoundary>
          </main>
          
          {/* God-Tier UI System with Suspense */}
          <Suspense fallback={<UISkeleton />}>
            <GodTierUI 
              audioData={{
                bass: audioAnalysis.bass,
                mid: audioAnalysis.mid,
                high: audioAnalysis.treble,
                volume: volume,
                spectrum: audioAnalysis.spectrum // Real-time spectrum data
              }}
              onAudioToggle={() => setIsPlaying(!isPlaying)}
              onVolumeChange={setVolume}
              onShaderChange={setActiveShader}
              onParamChange={(shaderId, paramName, value) => {
                // Handle parameter changes for specific shaders
                if (paramName === 'glitch') {
                  setGlitchIntensity(value)
                }
              }}
              isPlaying={isPlaying}
              currentShader={activeShader}
              shaderConfigs={shaderConfigurations}
            />
          </Suspense>
          
          {/* Lazy load AI components only after audio is initialized */}
          {isAudioInitialized && (
            <Suspense fallback={null}>
              <MagentaMusicGenerator />
            </Suspense>
          )}

          {/* 🚀 REVOLUTIONARY MUSIC INTERFACE - The Future of Music Creation */}
          {revolutionaryMode && isAudioInitialized && (
            <div className="absolute inset-0 z-50 bg-black/10">
              <Suspense fallback={
                <div className="absolute inset-0 flex items-center justify-center">
                  <LoadingSpinner message="Loading Revolutionary Systems..." size="large" variant="general" />
                </div>
              }>
                <RevolutionaryMusicInterface
                  isActive={revolutionaryMode}
                  onGestureComposed={(gesture) => {
                    console.log('🎭 New gesture composed:', gesture.type)
                    setGestureStats(prev => ({ 
                      total: prev.total + 1, 
                      types: { ...prev.types, [gesture.type]: (prev.types[gesture.type] || 0) + 1 }
                    }))
                  }}
                  onNeuralActivation={(neuronId, intensity) => {
                    console.log('🧠 Neural activation:', neuronId, intensity)
                    setNeuralActivity(intensity)
                  }}
                  className="absolute inset-4"
                />
              </Suspense>
              
              {/* Revolutionary Mode Toggle */}
              <button
                onClick={() => setRevolutionaryMode(false)}
                className="absolute top-4 right-4 z-60 bg-red-500/80 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-medium transition-all backdrop-blur-sm"
              >
                Exit Revolutionary Mode
              </button>
            </div>
          )}

          {/* Revolutionary Mode Activator */}
          {!revolutionaryMode && isAudioInitialized && (
            <button
              onClick={() => setRevolutionaryMode(true)}
              className="absolute bottom-20 right-4 z-40 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg shadow-purple-500/30"
            >
              🚀 Revolutionary Mode
            </button>
          )}
        </>
      )}
      <ExampleModal />
      <PerformanceSelector />
      <PerformanceMonitor />
      {showAnalytics && <PerformanceAnalytics />}
    </div>
    </AudioErrorBoundary>
  )}