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
                    if (process.env.NODE_ENV !== 'production') {
                      console.log('Clicked object', obj.id)
                    }
                    select(obj.id)
                    await triggerSound(obj.type, obj.id)
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
  const level = usePerformanceSettings((s) => s.level)
  const instanced = level !== 'low'
  const objects = useObjects((s) => s.objects)
  if (!instanced) {
    return (
      <>
        {objects.map((o) => (
          <SingleMusicalObject
            key={o.id}
            id={o.id}
            type={o.type}
            position={o.position}
          />
        ))}
      </>
    )
  }
  return <MusicalObjectInstances />
}

export default MusicalObject
