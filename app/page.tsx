"use client";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Physics } from "@react-three/cannon";
import FloatingSphere from "@/components/FloatingSphere";
import AudioVisualizer from "@/components/AudioVisualizer";
import Floor from "@/components/Floor";
import MusicalObject from "@/components/MusicalObject";
import SoundPortals from "@/components/SoundPortals";
import SpawnMenu from "@/components/SpawnMenu";
import EffectWorm from "@/components/EffectWorm";
import AudioSettingsPanel from "@/components/AudioSettingsPanel";
import { useEffect, useState } from "react";
import sliderStyles from "@/styles/slider.module.css";
import { startNote, stopNote } from "@/lib/audio";
import { useObjects } from "@/store/useObjects";

const Home = () => {
  // dynamic camera field-of-view state
  const [fov, setFov] = useState(50);

  // camera controller to update FOV imperatively
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
    startNote();
    const timer = setTimeout(() => {
      stopNote();
    }, 2000); // Stop the note after 2 seconds

    return () => clearTimeout(timer);
  }, []);

  const objects = useObjects((state) => state.objects);
  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      <Canvas shadows camera={{ position: [0, 5, 10], fov }}>
        {/* camera controller updates */}
        <CameraController fov={fov} />
        {/* lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight
          castShadow
          position={[5, 10, 5]}
          intensity={0.8}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        {/* background visualizer */}
        <AudioVisualizer />
        {/* physics simulation */}
        <Physics gravity={[0, -9.8, 0]}>
          <Floor />
          {objects.map((obj) => (
            <MusicalObject
              key={obj.id}
              id={obj.id}
              type={obj.type}
              position={obj.position}
            />
          ))}
          {/* experimental effect worm */}
          <EffectWorm id="worm" position={[0, 1, 0]} />
        </Physics>
        {/* floating demo sphere */}
        <FloatingSphere />
        {/* 3D portal ring for spawning sound objects */}
        <SoundPortals />
      </Canvas>

      {/* Zoom slider UI overlay */}
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

      {/* Spawn menu overlay */}
      <SpawnMenu />
      <AudioSettingsPanel />
    </div>
  );
};

export default Home;
