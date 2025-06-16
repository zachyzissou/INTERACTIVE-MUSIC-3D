"use client";
import React from 'react'
import { Html } from '@react-three/drei'
import { useLoops } from '../store/useLoops'
import { useObjects } from '../store/useObjects'
import { usePhysicsStore } from '../lib/physics'
import { getLoopProgress } from '../lib/audio'
import styles from '../styles/loopProgress.module.css'

const LoopProgress: React.FC = () => {
  const active = useLoops((s) => s.active)
  const objects = useObjects((s) => s.objects)
  const transforms = usePhysicsStore((s) => s.transforms)

  return (
    <>
      {Object.keys(active).map((id) => {
        const obj = objects.find((o) => o.id === id)
        if (!obj) return null
        const pos = transforms[id]?.position || obj.position
        const progress = getLoopProgress(id)
        return (
          <Html key={id} position={pos} transform>
            <div
              className={styles.progress}
              style={{
                background: `conic-gradient(var(--accent2) ${
                  progress * 360
                }deg, rgba(255,255,255,0.1) 0deg)`,
              }}
            />
          </Html>
        )
      })}
    </>
  )
}

export default LoopProgress
