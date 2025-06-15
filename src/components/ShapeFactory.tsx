import React from 'react'
import { ObjectType, objectConfigs } from '../config/objectTypes'

export function ShapeFactory({ type }: { type: ObjectType }) {
  const geom = objectConfigs[type].geometry
  switch (geom) {
    case 'cube':
      return <boxGeometry args={[0.5, 0.5, 0.5]} />
    case 'torus':
      return <torusGeometry args={[0.5, 0.2, 16, 32]} />
    case 'torusKnot':
      return <torusKnotGeometry args={[0.5, 0.15, 64, 16]} />
    case 'sphere':
    default:
      return <sphereGeometry args={[0.5, 32, 32]} />
  }
}

export default ShapeFactory
