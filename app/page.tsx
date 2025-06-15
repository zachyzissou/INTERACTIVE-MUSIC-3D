"use client";
import { Canvas, useThree } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import FloatingSphere from '@/components/FloatingSphere';
import AudioVisualizer from '@/components/AudioVisualizer';
import Floor from '@/components/Floor';
import MusicalObject from '@/components/MusicalObject';
import SoundPortals from '@/components/SoundPortals';
import { useEffect, useState } from 'react';
import { startNote, stopNote } from '@/lib/audio';
import { useObjects } from '@/store/useObjects';

const Home = () => {
  // dynamic camera distance state
  const [camZ, setCamZ] = useState(10);

  // camera controller to update Z position imperatively
  function CameraController({ camZ }: { camZ: number }) {
    const { camera } = useThree();
    useEffect(() => {
      camera.position.z = camZ;
    }, [camZ, camera]);
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
    <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
      {/* Zoom slider UI overlay */}
      <div
        style={{
          position: 'absolute',
          top: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          background: 'rgba(20,20,30,0.7)',
          padding: '0.5rem',
          borderRadius: '4px',
        }}
      >
        <label style={{ color: '#fff', marginRight: '0.5rem' }}>Zoom:</label>
        <input
          type="range"
          min={5}
          max={20}
          step={0.1}
          value={camZ}
          onChange={(e) => setCamZ(parseFloat(e.target.value))}
        />
      </div>
      <Canvas shadows camera={{ position: [0, 5, camZ], fov: 50 }}>
        {/* camera controller updates */}
        <CameraController camZ={camZ} />
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
        </Physics>
        {/* floating demo sphere */}
        <FloatingSphere />
        {/* 3D portal ring for spawning sound objects */}
        <SoundPortals />
      </Canvas>
    </div>
  );
};

export default Home;
