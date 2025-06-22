'use client'
import React from 'react'
import { ObjectType, objectConfigs } from '../config/objectTypes'
import { SHAPE_RADIUS } from '../config/constants'

export function ShapeFactory({ type }: { type: ObjectType }) {
  const geom = objectConfigs[type].geometry
  switch (geom) {
    case 'cube':
      return <boxGeometry args={[SHAPE_RADIUS, SHAPE_RADIUS, SHAPE_RADIUS]} />
    case 'torus':
      return <torusGeometry args={[SHAPE_RADIUS, 0.2, 16, 32]} />
    case 'torusKnot':
      return <torusKnotGeometry args={[SHAPE_RADIUS, 0.15, 64, 16]} />
    case 'sphere':
    default:
      return <sphereGeometry args={[SHAPE_RADIUS, 32, 32]} />
  }
}

export default ShapeFactory
