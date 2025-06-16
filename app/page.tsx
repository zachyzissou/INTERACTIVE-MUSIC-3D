"use client";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Physics } from "@react-three/cannon";
import * as THREE from "three";
import FloatingSphere from "@/components/FloatingSphere";
import AudioVisualizer from "@/components/AudioVisualizer";
import Floor from "@/components/Floor";
import MusicalObject from "@/components/MusicalObject";
import SoundPortals from "@/components/SoundPortals";
import SpawnIcons from "@/components/SpawnIcons";
import EffectWorm from "@/components/EffectWorm";
import { useEffect } from "react";
import { startNote, stopNote } from "@/lib/audio";
import { initPhysics } from "@/lib/physics";

const Home = () => {
  function ZoomControls() {
    const { camera } = useThree();
    useEffect(() => {
      const onWheel = (e: WheelEvent) => {
        const cam = camera as THREE.PerspectiveCamera;
        cam.fov = Math.min(100, Math.max(30, cam.fov + e.deltaY * 0.05));
        cam.updateProjectionMatrix();
      };
      window.addEventListener("wheel", onWheel);
      return () => window.removeEventListener("wheel", onWheel);
    }, [camera]);
    return null;
  }

  useEffect(() => {
    initPhysics();
    startNote();
    const timer = setTimeout(() => {
      stopNote();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
        <Physics>
          <ZoomControls />
          <ambientLight intensity={0.3} />
          <directionalLight
            castShadow
            position={[5, 10, 5]}
            intensity={0.8}
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <AudioVisualizer />
          <Floor />
          <MusicalObject />
          <EffectWorm id="worm" position={[0, 1, 0]} />
          <FloatingSphere />
          <SoundPortals />
        </Physics>
      </Canvas>

      <SpawnIcons />
    </div>
  );
};

export default Home;
