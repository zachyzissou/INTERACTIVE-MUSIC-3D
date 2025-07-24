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
  const [bassData, setBassData] = React.useState(0)
  const [midData, setMidData] = React.useState(0)
  const [highData, setHighData] = React.useState(0)
  const [volume, setVolume] = React.useState(1)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [activeShader, setActiveShader] = React.useState('metaball')
  const [glitchIntensity, setGlitchIntensity] = React.useState(0)

  React.useEffect(() => {
    const useDev = new URLSearchParams(window.location.search).get('devcanvas') === '1'
    const showAnalytics = new URLSearchParams(window.location.search).get('analytics') === '1'
    if (useDev) setScene(() => DevCanvas)
    if (showAnalytics) setShowAnalytics(true)
  }, [])

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
                bass: bassData,
                mid: midData,
                high: highData,
                volume: volume,
                spectrum: new Float32Array(32) // Mock spectrum data
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
        </>
      )}
      <ExampleModal />
      <PerformanceSelector />
      <PerformanceMonitor />
      {showAnalytics && <PerformanceAnalytics />}
    </div>
    </AudioErrorBoundary>
  )}