'use client'
import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { Group } from 'three'
import {
  PORTAL_RING_MIN_RADIUS,
  PORTAL_RING_MAX_RADIUS,
  PORTAL_RING_HEIGHT,
} from '../config/constants'

export const usePortalRing = (count: number) => {
  const groupRef = useRef<Group>(null!)
  const { viewport } = useThree()

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.2
    }
  })

  const radius = Math.min(
    Math.max(viewport.width / 2, PORTAL_RING_MIN_RADIUS),
    PORTAL_RING_MAX_RADIUS
  )
  const height = PORTAL_RING_HEIGHT

  const getPosition = (idx: number): [number, number, number] => {
    const angle = (idx / count) * Math.PI * 2
    return [Math.cos(angle) * radius, height, Math.sin(angle) * radius]
  }

  return { groupRef, getPosition }
}
