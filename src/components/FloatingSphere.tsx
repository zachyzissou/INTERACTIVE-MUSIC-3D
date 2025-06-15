import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import { startNote, stopNote } from '../lib/audio';
import { Mesh } from 'three';

const FloatingSphere = () => {
  const sphereRef = useRef<Mesh>(null!);

  useFrame(() => {
    if (sphereRef.current) {
      sphereRef.current.position.y = Math.sin(Date.now() * 0.001) * 1.5;
    }
  });

  useEffect(() => {
    startNote();
    return () => {
      stopNote();
    };
  }, []);

  return (
    <>
      <Sphere ref={sphereRef} args={[1, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial attach="material" color="royalblue" />
      </Sphere>
    </>
  );
};

export default FloatingSphere;