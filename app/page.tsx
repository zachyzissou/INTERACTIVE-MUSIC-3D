"use client";
import React from "react";
import dynamic from 'next/dynamic';
import PerformanceSelector from "@/components/PerformanceSelector";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import ExampleModal from "@/components/ExampleModal";
import StartOverlay from "@/components/StartOverlay";
import { CanvasErrorBoundary } from "@/components/CanvasErrorBoundary";
import { AudioErrorBoundary } from "@/components/AudioErrorBoundary";
import SafariCanvasDetector from "@/components/SafariCanvasDetector";
import PerformanceMonitor from "@/components/PerformanceMonitor";
import AccessibilityPanel from "@/components/AccessibilityPanel";
import { AudioControls } from "@/components/AudioControls";
import { startAudio } from "@/lib/engine";
import type { ShaderIconType } from "@/config/shaderConfigs";
import { shaderConfigurations } from "@/config/shaderConfigs";

// New God-Tier UI System
import GodTierUI from "@/components/ui/GodTierUI";

// Dynamic imports for code splitting
const CanvasScene = dynamic(() => import('../src/components/CanvasScene'), { 
  ssr: false,
  loading: () => <div className="absolute inset-0 flex items-center justify-center bg-black">
    <div className="text-white">Loading 3D Scene...</div>
  </div>
});

const DevCanvas = dynamic(() => import('../src/components/DevCanvas'), { 
  ssr: false,
  loading: () => <div className="absolute inset-0 flex items-center justify-center bg-black">
    <div className="text-white">Loading Dev Canvas...</div>
  </div>
});

const PerformanceAnalytics = dynamic(() => import("@/components/PerformanceAnalytics"), {
  ssr: false,
  loading: () => null
});

export default function Home() {
  const [Scene, setScene] = React.useState(() => CanvasScene)
  const [started, setStarted] = React.useState(false)
  const [showAnalytics, setShowAnalytics] = React.useState(false)
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
    const ok = await startAudio()
    if (ok) {
      setStarted(true)
    }
    return ok
  }, [])

  return (
    <AudioErrorBoundary>
    <div className="relative h-full w-full">
      <a href="#main-content" className="god-tier-skip-link">
        Skip to main content
      </a>
      {!started && <StartOverlay onFinish={handleStart} />}
      {started && (
        <>
          <main id="main-content" className="relative h-full w-full">
            <CanvasErrorBoundary>
              <SafariCanvasDetector>
                <Scene />
              </SafariCanvasDetector>
            </CanvasErrorBoundary>
          </main>
          
          {/* God-Tier UI System */}
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
        </>
      )}
      <ExampleModal />
      <PerformanceSelector />
      <PwaInstallPrompt />
      <PerformanceMonitor />
      <AudioControls />
      <AccessibilityPanel />
      {showAnalytics && <PerformanceAnalytics />}
    </div>
    </AudioErrorBoundary>
  )}