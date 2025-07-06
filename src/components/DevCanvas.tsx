'use client'
import React from 'react'
import { Canvas } from '@react-three/fiber'
import { logger } from '@/lib/logger'

export default function DevCanvas() {
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      logger.info('DevCanvas mounted')
    }
  }, [])
  return (
    <Canvas className="absolute inset-0">
      <mesh>
        <boxGeometry args={[1,1,1]} />
        <meshBasicMaterial color="hotpink" />
      </mesh>
    </Canvas>
  )
}
