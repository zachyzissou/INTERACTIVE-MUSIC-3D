import RAPIER from '@dimforge/rapier3d-compat'

interface AddMsg { type: 'add'; id: string; position: [number, number, number] }
interface RemoveMsg { type: 'remove'; id: string }
type Msg = AddMsg | RemoveMsg

let world: RAPIER.World | null = null
const bodies: Record<string, RAPIER.RigidBody> = {}
const colliders: Record<string, RAPIER.Collider> = {}
const anchors: Record<string, RAPIER.RigidBody> = {}
const joints: Record<string, RAPIER.ImpulseJoint> = {}

function step() {
  if (!world) return
  world.step()
  const updates = Object.entries(bodies).map(([id, body]) => {
    const t = body.translation()
    const r = body.rotation()
    return {
      id,
      position: [t.x, t.y, t.z] as [number, number, number],
      quaternion: [r.x, r.y, r.z, r.w] as [number, number, number, number],
    }
  })
  ;(postMessage as any)(updates)
}

RAPIER.init().then(() => {
  world = new RAPIER.World({ x: 0, y: -9.82, z: 0 })
  world.timestep = 1 / 30
  setInterval(step, 1000 / 30)
})

onmessage = (e: MessageEvent<Msg>) => {
  if (!world) return
  const data = e.data
  if (data.type === 'add') {
    const rbDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(
      data.position[0],
      data.position[1],
      data.position[2]
    )
    const body = world.createRigidBody(rbDesc)
    const collider = world.createCollider(
      RAPIER.ColliderDesc.ball(0.5),
      body
    )
    const anchorDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
      data.position[0],
      data.position[1],
      data.position[2]
    )
    const anchor = world.createRigidBody(anchorDesc)
    const joint = world.createImpulseJoint(
      RAPIER.JointData.spring(0, 50, 5, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }),
      anchor,
      body,
      true
    )
    bodies[data.id] = body
    colliders[data.id] = collider
    anchors[data.id] = anchor
    joints[data.id] = joint
  } else if (data.type === 'remove') {
    const body = bodies[data.id]
    const collider = colliders[data.id]
    const anchor = anchors[data.id]
    const joint = joints[data.id]
    if (joint) {
      world.removeImpulseJoint(joint, true)
      delete joints[data.id]
    }
    if (collider) {
      world.removeCollider(collider, true)
      delete colliders[data.id]
    }
    if (body) {
      world.removeRigidBody(body)
      delete bodies[data.id]
    }
    if (anchor) {
      world.removeRigidBody(anchor)
      delete anchors[data.id]
    }
  }
}
