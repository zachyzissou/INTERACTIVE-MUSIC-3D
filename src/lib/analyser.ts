import * as Tone from 'tone'
import * as THREE from 'three'
import { isAudioInitialized } from './audio'

let analyser: AnalyserNode | null = null
let dataArray: Uint8Array | null = null
let texture: THREE.DataTexture | null = null

export function getAnalyser() {
  if (!analyser) {
    if (!isAudioInitialized()) return null
    const ctx = Tone.getContext()
    analyser = ctx.rawContext.createAnalyser()
    analyser.fftSize = 512
    ctx.destination.connect(analyser)
    dataArray = new Uint8Array(analyser.frequencyBinCount)
    texture = new THREE.DataTexture(
      dataArray,
      analyser.frequencyBinCount,
      1,
      THREE.RedFormat
    )
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.wrapS = THREE.ClampToEdgeWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
  }
  return analyser
}

export function getFrequencyDataArray() {
  const a = getAnalyser()
  if (!a || !dataArray) return new Uint8Array(0)
  return dataArray
}

export function getFrequencyTexture() {
  const a = getAnalyser()
  if (!a || !texture) return null
  return texture
}

export function getAnalyserBands() {
  const analyserNode = getAnalyser()
  if (!analyserNode || !dataArray) {
    return { bass: 0, mid: 0, treble: 0 }
  }
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
  return { bass: low, mid, treble: high }
}

export function subscribeToAudioLevel(cb: (level: number) => void) {
  if (!getAnalyser()) return () => {}
  let raf: number
  const tick = () => {
    const { bass, mid, treble } = getAnalyserBands()
    cb((bass + mid + treble) / 3)
    raf = requestAnimationFrame(tick)
  }
  tick()
  return () => cancelAnimationFrame(raf)
}
