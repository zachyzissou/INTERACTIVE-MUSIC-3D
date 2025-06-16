"use client";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Physics } from "@react-three/cannon";
import * as THREE from "three";
import FloatingSphere from "@/components/FloatingSphere";
import AudioVisualizer from "@/components/AudioVisualizer";
import Floor from "@/components/Floor";
import MusicalObject from "@/components/MusicalObject";
import SoundPortals from "@/components/SoundPortals";
import SpawnMenu from "@/components/SpawnMenu";
import SpawnPreviewList from "@/components/SpawnPreviewList";
import EffectWorm from "@/components/EffectWorm";
import { useEffect, useState } from "react";
import sliderStyles from "@/styles/slider.module.css";
import { startNote, stopNote } from "@/lib/audio";
import { initPhysics } from "@/lib/physics";

const Home = () => {
  const [fov, setFov] = useState(50);

  function CameraController({ fov }: { fov: number }) {
    const { camera } = useThree();
    useEffect(() => {
      const perspCam = camera as THREE.PerspectiveCamera;
      perspCam.fov = fov;
      perspCam.updateProjectionMatrix();
    }, [fov, camera]);
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
      <Canvas shadows camera={{ position: [0, 5, 10], fov }}>
        <Physics>
          <CameraController fov={fov} />
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
        <SpawnPreviewList />
      </Canvas>

      <div className={sliderStyles.sliderWrapper}>
        <label style={{ color: "#fff", marginRight: "0.5rem" }}>FOV:</label>
        <input
          type="range"
          min={30}
          max={100}
          step={1}
          value={fov}
          onChange={(e) => setFov(parseFloat(e.target.value))}
        />
      </div>

      <SpawnMenu />
    </div>
  );
};

export default Home;
