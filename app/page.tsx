"use client";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { PerspectiveCamera, AdaptiveDpr } from "@react-three/drei";
import MusicalObject from "@/components/MusicalObject";
import BottomDrawer from "@/components/BottomDrawer";
import SoundInspector from "@/components/SoundInspector";
import { useEffectSettings } from "@/store/useEffectSettings";
import { useObjects } from "@/store/useObjects";
import ExampleModal from "@/components/ExampleModal";
import { useEffect } from "react";
import * as Tone from "tone";
import { playNote } from "@/lib/audio";

export default function Home() {
  const selected = useEffectSettings((s) => s.selected);
  const objects = useObjects((s) => s.objects);
  const objType = objects.find((o) => o.id === selected)?.type;

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
      <Canvas className="fixed inset-0 w-screen h-screen" shadows>
        <AdaptiveDpr pixelated />
        <Physics>
          <PerspectiveCamera makeDefault fov={50} position={[0, 5, 10]} />
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow />
          <pointLight position={[0, 5, -5]} intensity={0.5} />
          <MusicalObject />
        </Physics>
      </Canvas>
      <ExampleModal />
      {selected && objType && (
        <SoundInspector objectId={selected} type={objType} />
      )}
      <BottomDrawer />
    </>
  );
}
