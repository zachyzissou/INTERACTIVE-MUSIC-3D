"use client";
import React from "react";
import dynamic from 'next/dynamic';
import PerformanceSelector from "@/components/PerformanceSelector";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import ExampleModal from "@/components/ExampleModal";
import StartOverlay from "@/components/StartOverlay";
import { CanvasErrorBoundary } from "@/components/CanvasErrorBoundary";
import SafariCanvasDetector from "@/components/SafariCanvasDetector";
import PerformanceMonitor from "@/components/PerformanceMonitor";
import AccessibilityPanel from "@/components/AccessibilityPanel";
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
  const [audioSource, setAudioSource] = React.useState<MediaElementAudioSourceNode | null>(null)
  const [spectrum, setSpectrum] = React.useState<Float32Array>(new Float32Array(16))

  // Use imported shader configurations from config file
  const [shaderConfigs, setShaderConfigs] = React.useState(shaderConfigurations)

  React.useEffect(() => {
    const useDev = new URLSearchParams(window.location.search).get('devcanvas') === '1'
    const showAnalytics = new URLSearchParams(window.location.search).get('analytics') === '1'
    if (useDev) setScene(() => DevCanvas)
    if (showAnalytics) setShowAnalytics(true)
  }, [])

  const handleStart = React.useCallback(async () => {
    try {
      await startAudio()
      setIsPlaying(true)
    } catch (error) {
      console.warn('Audio initialization failed (Safari/WebKit compatibility):', error)
      // Continue without audio on WebKit/Safari
      setIsPlaying(false)
    }
    // Always set started to true to show main content, regardless of audio status
    setStarted(true)
  }, [])

  const handleAudioToggle = React.useCallback(() => {
    setIsPlaying(!isPlaying)
    // Here you would integrate with your actual audio system
  }, [isPlaying])

  const handleVolumeChange = React.useCallback((volume: number) => {
    setVolume(volume)
    // Here you would integrate with your actual audio system
  }, [])

  const handleShaderChange = React.useCallback((shaderId: string) => {
    setActiveShader(shaderId)
    // Here you would integrate with your shader system
  }, [])

  // Handler for updating shader param values
  const handleParamChange = (shaderId: string, paramName: string, value: number) => {
    setShaderConfigs(prev => prev.map((config: any) =>
      config.id === shaderId
        ? {
            ...config,
            params: {
              ...config.params,
              [paramName]: {
                ...config.params[paramName],
                value
              }
            }
          }
        : config
    ))
  }

  // Simulate audio data updates (replace with real audio analysis)
  React.useEffect(() => {
    if (!isPlaying) return
    
    const generateSpectrum = () => new Float32Array(16).map(() => Math.random() * 0.5)
    
    const interval = setInterval(() => {
      setBassData(Math.random() * 0.8)
      setMidData(Math.random() * 0.6)
      setHighData(Math.random() * 0.4)
      setSpectrum(generateSpectrum())
    }, 100)
    
    return () => clearInterval(interval)
  }, [isPlaying])

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      {!started && <StartOverlay onFinish={handleStart} />}
      {started && (
        <>
          <main id="main-content" className="relative w-full h-full">
            <CanvasErrorBoundary>
              <SafariCanvasDetector>
                <Scene />
              </SafariCanvasDetector>
            </CanvasErrorBoundary>
          </main>
          {/* Unified God-Tier UI */}
          <GodTierUI
            audioData={{
              bass: bassData,
              mid: midData,
              high: highData,
              volume,
              spectrum
            }}
            onAudioToggle={() => setIsPlaying((p) => !p)}
            onVolumeChange={setVolume}
            onShaderChange={setActiveShader}
            onParamChange={handleParamChange}
            isPlaying={isPlaying}
            currentShader={activeShader}
            shaderConfigs={shaderConfigs}
          />
        </>
      )}
      <ExampleModal />
      <PerformanceSelector />
      <PwaInstallPrompt />
      <PerformanceMonitor />
      <AccessibilityPanel />
      {showAnalytics && <PerformanceAnalytics />}
    </>
  )
}
