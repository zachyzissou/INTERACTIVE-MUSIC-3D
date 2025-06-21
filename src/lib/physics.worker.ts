import RAPIER from '@dimforge/rapier3d-compat'

interface AddMsg { type: 'add'; id: string; position: [number, number, number] }
interface RemoveMsg { type: 'remove'; id: string }
type Msg = AddMsg | RemoveMsg

let world: RAPIER.World | null = null
const bodies: Record<string, RAPIER.RigidBody> = {}
const colliders: Record<string, RAPIER.Collider> = {}

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
    bodies[data.id] = body
    colliders[data.id] = collider
  } else if (data.type === 'remove') {
    const body = bodies[data.id]
    const collider = colliders[data.id]
    if (collider) {
      world.removeCollider(collider, true)
      delete colliders[data.id]
    }
    if (body) {
      world.removeRigidBody(body)
      delete bodies[data.id]
    }
  }
}
