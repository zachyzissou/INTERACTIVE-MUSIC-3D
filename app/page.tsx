"use client";
import React from "react";
import dynamic from "next/dynamic";
import { useSelectedShape } from "@/store/useSelectedShape";
import ExampleModal from "@/components/ExampleModal";
import BottomDrawer from "@/components/BottomDrawer";
import PerformanceSelector from "@/components/PerformanceSelector";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import ShapeEditorPanel from "@/components/ShapeEditorPanel";

const CanvasScene = dynamic(() => import("@/components/CanvasScene"), {
  ssr: false,
});

export default function Home() {
  // subscribe to selected shape to trigger re-renders
  useSelectedShape((s) => s.selected);

  return (
    <>
      <CanvasScene />
      <ExampleModal />
      <ShapeEditorPanel />
      <PerformanceSelector />
      <PwaInstallPrompt />
      <BottomDrawer />
    </>
  );
}
