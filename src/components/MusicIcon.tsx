import React from 'react'
import { Text3D } from '@react-three/drei'
import { ObjectType, objectConfigs } from '../config/objectTypes'
import font from '../../public/fonts/NotoMusic.json'

interface MusicIconProps {
  type: ObjectType
  size?: number
  height?: number
}

const MusicIcon: React.FC<MusicIconProps> = ({ type, size = 0.6, height = 0.1 }) => {
  const cfg = objectConfigs[type]
  return (
    <Text3D font={font as any} size={size} height={height} bevelEnabled bevelSize={0.02}>
      {cfg.icon}
      <meshStandardMaterial color={cfg.color} emissive={cfg.color} />
    </Text3D>
  )
}

export default MusicIcon
