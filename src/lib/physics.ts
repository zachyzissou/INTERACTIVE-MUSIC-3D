import { create } from 'zustand'
import RAPIER from '@dimforge/rapier3d-compat'

export interface Transform {
  position: [number, number, number]
  quaternion: [number, number, number, number]
}

interface PhysicsState {
  transforms: Record<string, Transform>
}

export const usePhysicsStore = create<PhysicsState>(() => ({ transforms: {} }))

export interface BodyUpdate {
  id: string
  position: [number, number, number]
  quaternion: [number, number, number, number]
}

let world: RAPIER.World | null = null
const bodies: Record<string, RAPIER.RigidBody> = {}
const colliders: Record<string, RAPIER.Collider> = {}
const anchors: Record<string, RAPIER.RigidBody> = {}
const joints: Record<string, RAPIER.ImpulseJoint> = {}

function step() {
  if (!world) return
  world.step()
  const map: Record<string, Transform> = {}
  Object.entries(bodies).forEach(([id, body]) => {
    const t = body.translation()
    const r = body.rotation()
    map[id] = {
      position: [t.x, t.y, t.z],
      quaternion: [r.x, r.y, r.z, r.w],
    }
  })
  usePhysicsStore.setState({ transforms: map })
}

export async function initPhysics() {
  if (world) return
  await RAPIER.init()
  world = new RAPIER.World({ x: 0, y: -9.82, z: 0 })
  world.timestep = 1 / 30
  const loop = () => {
    step()
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)
}

export interface AddBodyOptions {
  id: string
  position: [number, number, number]
}

export function addBody({ id, position }: AddBodyOptions) {
  if (!world) return
  const rbDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(
    position[0],
    position[1],
    position[2]
  )
  const body = world.createRigidBody(rbDesc)
  const collider = world.createCollider(RAPIER.ColliderDesc.ball(0.5), body)
  const anchorDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
    position[0],
    position[1],
    position[2]
  )
  const anchor = world.createRigidBody(anchorDesc)
  const joint = world.createImpulseJoint(
    RAPIER.JointData.spring(0, 50, 5, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }),
    anchor,
    body,
    true
  )
  bodies[id] = body
  colliders[id] = collider
  anchors[id] = anchor
  joints[id] = joint
}

export function removeBody(id: string) {
  if (!world) return
  const body = bodies[id]
  const collider = colliders[id]
  const anchor = anchors[id]
  const joint = joints[id]
  if (joint) {
    world.removeImpulseJoint(joint, true)
    delete joints[id]
  }
  if (collider) {
    world.removeCollider(collider, true)
    delete colliders[id]
  }
  if (body) {
    world.removeRigidBody(body)
    delete bodies[id]
  }
  if (anchor) {
    world.removeRigidBody(anchor)
    delete anchors[id]
  }
}
