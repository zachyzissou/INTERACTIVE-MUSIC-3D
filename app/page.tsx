"use client";
import React from "react";
import dynamic from 'next/dynamic';
import BottomDrawer from "@/components/BottomDrawer";
import PerformanceSelector from "@/components/PerformanceSelector";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import ShapeEditorPanel from "@/components/ShapeEditorPanel";
import ExampleModal from "@/components/ExampleModal";
const CanvasScene = dynamic(() => import('../src/components/CanvasScene'), { ssr: false });
const DevCanvas = dynamic(() => import('../src/components/DevCanvas'), { ssr: false })

export default function Home() {
  const useDevCanvas =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('devcanvas') === '1'

  const Scene = useDevCanvas ? DevCanvas : CanvasScene

  return (
    <>
      <div className="h-screen w-screen relative">
        <Scene />
      </div>
      <ExampleModal />
      <ShapeEditorPanel />
      <PerformanceSelector />
      <PwaInstallPrompt />
      <BottomDrawer />
    </>
  )
}
