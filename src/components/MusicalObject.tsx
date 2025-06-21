'use client'
// src/components/MusicalObject.tsx
import React, { useMemo } from 'react'
import { Instances, Instance } from '@react-three/drei'
import { AnimatePresence } from 'framer-motion'
import { objectConfigs, objectTypes, ObjectType } from '../config/objectTypes'
import { useObjects, MusicalObject as Obj } from '../store/useObjects'
import ShapeFactory from './ShapeFactory'
import EffectPanel from "./EffectPanel"
import { useEffectSettings } from '../store/useEffectSettings'
import { usePhysicsStore } from '../lib/physics'
import * as THREE from 'three'
import SingleMusicalObject from './SingleMusicalObject'
import { usePerformance } from '../store/usePerformance'
import { playNote, playChord, playBeat } from '../lib/audio'

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
  const select = useEffectSettings((s) => s.select)
  const selected = useEffectSettings((s) => s.selected)

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
                  position={pos as any}
                  rotation={rot}
                  scale={objectConfigs[t].baseScale}
                  onClick={(e) => {
                    e.stopPropagation()
                    select(obj.id)
                    if (obj.type === 'note') playNote(obj.id)
                    else if (obj.type === 'chord') playChord(obj.id)
                    else playBeat(obj.id)
                  }}
                />
              )
            })}
          </Instances>
        )
      })}
      <AnimatePresence>
        {selected && transforms[selected] && (
          <EffectPanel
            objectId={selected}
            position={transforms[selected].position as [number, number, number]}
          />
        )}
      </AnimatePresence>
    </>
  )
}

const MusicalObject: React.FC = () => {
  const instanced = usePerformance((s) => s.instanced)
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
