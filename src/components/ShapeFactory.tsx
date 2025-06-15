import React from 'react'
import { ObjectType, objectConfigs } from '../config/objectTypes'

interface ShapeFactoryProps {
  type: ObjectType
}

const ShapeFactory: React.FC<ShapeFactoryProps> = ({ type }) => {
  const geom = objectConfigs[type].geometry
  switch (geom) {
    case 'torus':
      return <torusGeometry args={[0.5, 0.2, 16, 32]} />
    case 'sphere':
    default:
      return <sphereGeometry args={[0.5, 32, 32]} />
  }
}

export default ShapeFactory
