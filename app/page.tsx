"use client";
import React from "react";
import dynamic from 'next/dynamic';
import PerformanceSelector from "@/components/PerformanceSelector";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import ShapeEditorPanel from "@/components/ShapeEditorPanel";
import ExampleModal from "@/components/ExampleModal";
import StartOverlay from "@/components/StartOverlay";
import CanvasErrorBoundary from "@/components/CanvasErrorBoundary";
import AudioErrorBoundary from "@/components/AudioErrorBoundary";
import PerformanceMonitor from "@/components/PerformanceMonitor";
import { startAudio } from "@/lib/engine";

// Dynamic imports for code splitting
const CanvasScene = dynamic(() => import('../src/components/CanvasScene'), { 
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-black flex items-center justify-center">
    <div className="text-white">Loading 3D Scene...</div>
  </div>
});

const DevCanvas = dynamic(() => import('../src/components/DevCanvas'), { 
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-black flex items-center justify-center">
    <div className="text-white">Loading Dev Canvas...</div>
  </div>
});

const BottomDrawer = dynamic(() => import("@/components/BottomDrawer"), {
  ssr: false,
  loading: () => <div className="fixed bottom-0 left-0 right-0 h-20 bg-gray-900 bg-opacity-80" />
});

const PerformanceAnalytics = dynamic(() => import("@/components/PerformanceAnalytics"), {
  ssr: false,
  loading: () => null
});

export default function Home() {
  const [Scene, setScene] = React.useState(() => CanvasScene)
  const [started, setStarted] = React.useState(false)
  const [showAnalytics, setShowAnalytics] = React.useState(false)
  
  React.useEffect(() => {
    const useDev = new URLSearchParams(window.location.search).get('devcanvas') === '1'
    const showAnalytics = new URLSearchParams(window.location.search).get('analytics') === '1'
    if (useDev) setScene(() => DevCanvas)
    if (showAnalytics) setShowAnalytics(true)
  }, [])

  const handleStart = React.useCallback(async () => {
    await startAudio()
    setStarted(true)
  }, [])

  return (
    <>
      {!started && <StartOverlay onFinish={handleStart} />}
      {started && (
        <>
          <div className="relative h-full w-full">
            <CanvasErrorBoundary>
              <Scene />
            </CanvasErrorBoundary>
          </div>
          <ShapeEditorPanel />
        </>
      )}
      <ExampleModal />
      <PerformanceSelector />
      <PwaInstallPrompt />
      <PerformanceMonitor />
      {showAnalytics && <PerformanceAnalytics />}
      {started && (
        <AudioErrorBoundary>
          <BottomDrawer />
        </AudioErrorBoundary>
      )}
    </>
  )
}
