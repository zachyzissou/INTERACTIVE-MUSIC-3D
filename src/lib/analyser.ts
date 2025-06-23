import * as Tone from 'tone'
import * as THREE from 'three'

let analyser: AnalyserNode | null = null
let dataArray: Uint8Array | null = null
let texture: THREE.DataTexture | null = null

export function getAnalyser() {
  if (!analyser) {
    const ctx = Tone.getContext()
    analyser = ctx.rawContext.createAnalyser()
    analyser.fftSize = 512
    ctx.destination.connect(analyser)
    dataArray = new Uint8Array(analyser.frequencyBinCount)
    texture = new THREE.DataTexture(dataArray, analyser.frequencyBinCount, 1, THREE.RedFormat)
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.wrapS = THREE.ClampToEdgeWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
  }
  return analyser!
}

export function getFrequencyDataArray() {
  getAnalyser()
  return dataArray!
}

export function getFrequencyTexture() {
  getAnalyser()
  return texture!
}

export function getFrequencyBands() {
  const analyserNode = getAnalyser()
  const arr = getFrequencyDataArray()
  analyserNode.getByteFrequencyData(arr)
  const band = (s: number, e: number) => {
    let sum = 0
    for (let i = s; i < e; i++) sum += arr[i]
    return sum / (e - s)
  }
  const low = band(0, 85) / 255
  const mid = band(85, 170) / 255
  const high = band(170, 255) / 255
  if (texture) texture.needsUpdate = true
  return { low, mid, high }
}

export function subscribeToAudioLevel(cb: (level: number) => void) {
  getAnalyser()
  let raf: number
  const tick = () => {
    const { low, mid, high } = getFrequencyBands()
    cb((low + mid + high) / 3)
    raf = requestAnimationFrame(tick)
  }
  tick()
  return () => cancelAnimationFrame(raf)
}
