import * as CANNON from 'cannon-es'

interface AddMsg { type: 'add'; id: string; position: [number, number, number] }
interface RemoveMsg { type: 'remove'; id: string }
type Msg = AddMsg | RemoveMsg

const world = new CANNON.World()
world.gravity.set(0, -9.82, 0)
const bodies: Record<string, CANNON.Body> = {}

function step() {
  world.step(1 / 30)
  const updates = Object.entries(bodies).map(([id, body]) => ({
    id,
    position: [body.position.x, body.position.y, body.position.z],
    quaternion: [
      body.quaternion.x,
      body.quaternion.y,
      body.quaternion.z,
      body.quaternion.w,
    ],
  }))
  ;(postMessage as any)(updates)
}

setInterval(step, 1000 / 30)

onmessage = (e: MessageEvent<Msg>) => {
  const data = e.data
  if (data.type === 'add') {
    const body = new CANNON.Body({
      mass: 1,
      shape: new CANNON.Sphere(0.5),
      position: new CANNON.Vec3(...data.position),
    })
    bodies[data.id] = body
    world.addBody(body)
  } else if (data.type === 'remove') {
    const body = bodies[data.id]
    if (body) {
      world.removeBody(body)
      delete bodies[data.id]
    }
  }
}
