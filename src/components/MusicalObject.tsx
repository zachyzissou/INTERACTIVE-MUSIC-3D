'use client'
// src/components/MusicalObject.tsx
import React, { useMemo } from 'react'
import { Instances, Instance } from '@react-three/drei'
import { objectConfigs, objectTypes, ObjectType } from '../config/objectTypes'
import { useObjects, MusicalObject as Obj } from '../store/useObjects'
import ShapeFactory from './ShapeFactory'
import { useSelectedShape } from '../store/useSelectedShape'
import { usePhysicsStore } from '../lib/physics'
import * as THREE from 'three'
import SingleMusicalObject from './SingleMusicalObject'
import { usePerformanceSettings } from '../store/usePerformanceSettings'
import { triggerSound } from '../lib/soundTriggers'
import { logger } from '../lib/logger'

// Group objects by type for instanced rendering
function groupByType(objects: Obj[]) {
  const map: Record<ObjectType, Obj[]> = {
    note: [],
    chord: [],
    beat: [],
    loop: [],
  }
  objects.forEach((o) => map[o.type].push(o))
  return map
}

const MusicalObjectInstances: React.FC = () => {
  const objects = useObjects((s) => s.objects)
  const grouped = useMemo(() => groupByType(objects), [objects])
  const transforms = usePhysicsStore((s) => s.transforms)
  const select = useSelectedShape((s) => s.selectShape)
  const selected = useSelectedShape((s) => s.selected)

  return (
    <>
      {objectTypes.map((t) => {
        const list = grouped[t]
        if (!list.length) return null
        return (
          <Instances key={t} limit={1000} castShadow receiveShadow>
            <ShapeFactory type={t} />
            <meshStandardMaterial vertexColors />
            {list.map((obj) => {
              const tr = transforms[obj.id]
              const pos = tr ? tr.position : obj.position
              const quat = tr ? tr.quaternion : [0, 0, 0, 1]
              const rot = new THREE.Euler().setFromQuaternion(
                new THREE.Quaternion(...quat)
              )
              return (
                <Instance
                  key={obj.id}
                  color={objectConfigs[t].color}
                  position={pos}
                  rotation={rot}
                  scale={objectConfigs[t].baseScale}
                  onClick={async (e) => {
                    e.stopPropagation()
                    
                    // Immediate visual feedback
                    
                    // Flash effect - make the shape briefly larger and brighter
                    const mesh = e.object
                    if (mesh && mesh.scale) {
                      const originalScale = mesh.scale.clone()
                      mesh.scale.multiplyScalar(1.5)
                      setTimeout(() => {
                        if (mesh.scale) mesh.scale.copy(originalScale)
                      }, 200)
                    }
                    
                    select(obj.id)
                    
                    // Try to play sound
                    const success = await triggerSound(obj.type, obj.id)
                    
                    // Show user feedback
                    if (success) {
                    } else {
                      console.warn(`❌ ${obj.type} sound failed - check audio initialization`)
                    }
                  }}
                />
              )
            })}
          </Instances>
        )
      })}
      {/* EffectPanel removed - Drawer handles UI */}
    </>
  )
}

const MusicalObject: React.FC = () => {
  const objects = useObjects((s) => s.objects)
  const select = useSelectedShape((s) => s.selectShape)
  
  // Temporarily use simple meshes for debugging visibility
  return (
    <>
      {objects.map((obj) => {
        const config = objectConfigs[obj.type]
        return (
          <mesh
            key={obj.id}
            position={obj.position}
            scale={[2, 2, 2]} // Make them very large for visibility
            onClick={async (e) => {
              e.stopPropagation()
              select(obj.id)
              const success = await triggerSound(obj.type, obj.id)
            }}
          >
            {config.geometry === 'sphere' && <sphereGeometry args={[1, 32, 32]} />}
            {config.geometry === 'cube' && <boxGeometry args={[1, 1, 1]} />}
            {config.geometry === 'torus' && <torusGeometry args={[1, 0.4, 16, 32]} />}
            {config.geometry === 'torusKnot' && <torusKnotGeometry args={[1, 0.3, 64, 16]} />}
            <meshStandardMaterial 
              color={config.color} 
              emissive={config.color}
              emissiveIntensity={0.2}
              roughness={0.3}
              metalness={0.7}
            />
          </mesh>
        )
      })}
    </>
  )
}

export default MusicalObject
