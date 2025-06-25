"use client";
import React, { useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { PerspectiveCamera, AdaptiveDpr } from "@react-three/drei";
import * as THREE from "three";
import AnimatedGradient from "@/components/AnimatedGradient";
import MusicalObject from "@/components/MusicalObject";
import BottomDrawer from "@/components/BottomDrawer";
import SpawnMeshButton from "@/components/SpawnMeshButton";
import { useSelectedShape } from "@/store/useSelectedShape";
import ExampleModal from "@/components/ExampleModal";
import * as Tone from "tone";
import { playNote } from "@/lib/audio";

function ResizeHandler() {
  const { camera, gl } = useThree();
  React.useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if ('aspect' in camera) {
        (camera as THREE.PerspectiveCamera).aspect = w / h;
        camera.updateProjectionMatrix();
      }
      gl.setSize(w, h);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [camera, gl]);
  return null;
}

export default function Home() {
  const selected = useSelectedShape((s) => s.selected);

  React.useEffect(() => {
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
      <div className="h-screen w-screen relative">
        <Canvas className="w-full h-full" shadows>
          <AdaptiveDpr pixelated />
          <AnimatedGradient />
          <ResizeHandler />
          <Physics>
            <PerspectiveCamera makeDefault fov={50} position={[0, 5, 10]} />
            <ambientLight intensity={0.4} />
            <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow />
            <pointLight position={[0, 5, -5]} intensity={0.5} />
            <MusicalObject />
          </Physics>
          <SpawnMeshButton />
        </Canvas>
      </div>
      <ExampleModal />
      <BottomDrawer />
    </>
  );
}
