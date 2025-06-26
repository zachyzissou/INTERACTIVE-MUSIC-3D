'use client'
import React from 'react'
import { Canvas } from '@react-three/fiber'

export default function DevCanvas() {
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('DevCanvas mounted')
    }
  }, [])
  return (
    <Canvas className="w-full h-full">
      <mesh>
        <boxGeometry args={[1,1,1]} />
        <meshBasicMaterial color="hotpink" />
      </mesh>
    </Canvas>
  )
}
