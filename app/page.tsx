"use client";
import React from "react";
import dynamic from 'next/dynamic';
import BottomDrawer from "@/components/BottomDrawer";
import PerformanceSelector from "@/components/PerformanceSelector";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import ShapeEditorPanel from "@/components/ShapeEditorPanel";
import ExampleModal from "@/components/ExampleModal";
import StartOverlay from "@/components/StartOverlay";
import { startAudio } from "@/lib/engine";
const CanvasScene = dynamic(() => import('../src/components/CanvasScene'), { ssr: false });
const DevCanvas = dynamic(() => import('../src/components/DevCanvas'), { ssr: false })

export default function Home() {
  const [Scene, setScene] = React.useState(() => CanvasScene)
  const [started, setStarted] = React.useState(false)
  React.useEffect(() => {
    const useDev = new URLSearchParams(window.location.search).get('devcanvas') === '1'
    if (useDev) setScene(() => DevCanvas)
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
          <div className="h-screen w-screen relative">
            <Scene />
          </div>
          <ShapeEditorPanel />
        </>
      )}
      <ExampleModal />
      <PerformanceSelector />
      <PwaInstallPrompt />
      <BottomDrawer />
    </>
  )
}
