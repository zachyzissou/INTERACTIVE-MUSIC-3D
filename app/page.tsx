"use client";
import React from "react";
import dynamic from 'next/dynamic';
import BottomDrawer from "@/components/BottomDrawer";
import PerformanceSelector from "@/components/PerformanceSelector";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import ShapeEditorPanel from "@/components/ShapeEditorPanel";
import ExampleModal from "@/components/ExampleModal";
const CanvasScene = dynamic(() => import('../src/components/CanvasScene'), { ssr: false });

export default function Home() {

  return (
    <>
      <div className="h-screen w-screen relative">
        <CanvasScene />
      </div>
      <ExampleModal />
      <ShapeEditorPanel />
      <PerformanceSelector />
      <PwaInstallPrompt />
      <BottomDrawer />
    </>
  );
}
