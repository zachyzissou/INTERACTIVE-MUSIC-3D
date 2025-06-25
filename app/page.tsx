"use client";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { PerspectiveCamera, AdaptiveDpr } from "@react-three/drei";
import MusicalObject from "@/components/MusicalObject";
import BottomDrawer from "@/components/BottomDrawer";
import { useSelectedShape } from "@/store/useSelectedShape";
import ExampleModal from "@/components/ExampleModal";
import { useEffect } from "react";
import * as Tone from "tone";
import { playNote } from "@/lib/audio";

export default function Home() {
  const selected = useSelectedShape((s) => s.selected);

  useEffect(() => {
    const start = async () => {
      window.removeEventListener('pointerdown', start)
      await Tone.start()
      await Tone.getContext().resume()
      playNote('init')
    }
    window.addEventListener('pointerdown', start, { once: true })
    return () => window.removeEventListener('pointerdown', start)
  }, [])

  return (
    <>
      <div className="w-screen h-screen">
        <Canvas className="w-full h-full" shadows>
          <AdaptiveDpr pixelated />
          <Physics>
            <PerspectiveCamera makeDefault fov={50} position={[0, 5, 10]} />
            <ambientLight intensity={0.4} />
            <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow />
            <pointLight position={[0, 5, -5]} intensity={0.5} />
            <MusicalObject />
          </Physics>
        </Canvas>
      </div>
      <ExampleModal />
      <BottomDrawer />
    </>
  );
}
