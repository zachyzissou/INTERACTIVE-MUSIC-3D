'use client'
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import { Mesh } from 'three';

const FloatingSphere = () => {
  const sphereRef = useRef<Mesh>(null!);

  useFrame(({ clock }) => {
    if (sphereRef.current) {
      sphereRef.current.position.y = Math.sin(clock.getElapsedTime()) * 1.5;
    }
  });


  return (
    <>
      <Sphere ref={sphereRef} args={[1, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial attach="material" color="royalblue" />
      </Sphere>
    </>
  );
};

export default FloatingSphere;
