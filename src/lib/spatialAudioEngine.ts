/**
 * 🚀 REVOLUTIONARY SPATIAL AUDIO ENGINE
 * 
 * This engine transforms flat audio into immersive 3D soundscapes
 * with physics-based propagation, distance modeling, and spatial awareness.
 * 
 * Inspired by: Abbey Road Studios + Dolby Atmos + Video Game Audio Design
 */

import * as THREE from 'three'
import { getTone, isAudioInitialized } from './audio'

interface SpatialAudioSource {
  id: string
  position: THREE.Vector3
  velocity: THREE.Vector3
  audioNode: any // Tone.js audio node
  pannerNode: PannerNode
  gainNode: GainNode
  isPlaying: boolean
  frequency: number
  type: 'note' | 'chord' | 'beat' | 'ambient'
  visualEffect?: {
    color: string
    intensity: number
    radius: number
  }
}

interface ListenerProperties {
  position: THREE.Vector3
  orientation: THREE.Vector3
  velocity: THREE.Vector3
}

class SpatialAudioEngine {
  private static instance: SpatialAudioEngine
  private audioContext: AudioContext | null = null
  private listener: AudioListener | null = null
  private sources: Map<string, SpatialAudioSource> = new Map()
  private listenerProps: ListenerProperties
  private masterGain: GainNode | null = null
  private reverbNode: ConvolverNode | null = null
  private analyser: AnalyserNode | null = null
  
  // Physics simulation properties
  private roomSize = new THREE.Vector3(50, 20, 50) // Virtual room dimensions
  private dampingFactor = 0.92 // Audio dampening over distance
  private speedOfSound = 343 // Meters per second
  
  private constructor() {
    this.listenerProps = {
      position: new THREE.Vector3(0, 5, 10),
      orientation: new THREE.Vector3(0, 0, -1),
      velocity: new THREE.Vector3(0, 0, 0)
    }
  }

  static getInstance(): SpatialAudioEngine {
    if (!SpatialAudioEngine.instance) {
      SpatialAudioEngine.instance = new SpatialAudioEngine()
    }
    return SpatialAudioEngine.instance
  }

  async initialize(): Promise<boolean> {
    try {
      if (!isAudioInitialized()) {
        console.warn('Base audio system not initialized')
        return false
      }

      const Tone = getTone()
      if (!Tone) return false

      this.audioContext = Tone.getContext().rawContext
      
      // Set up master gain
      this.masterGain = this.audioContext.createGain()
      this.masterGain.gain.value = 0.8
      this.masterGain.connect(this.audioContext.destination)

      // Set up 3D audio listener
      this.listener = this.audioContext.listener
      this.updateListenerPosition()

      // Create reverb for spatial realism
      await this.setupReverb()

      // Set up master analyser for spatial visualization
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 1024
      this.masterGain.connect(this.analyser)

      console.log('🚀 Spatial Audio Engine initialized successfully')
      return true

    } catch (error) {
      console.error('Failed to initialize Spatial Audio Engine:', error)
      return false
    }
  }

  private async setupReverb() {
    if (!this.audioContext) return

    this.reverbNode = this.audioContext.createConvolver()
    
    // Create impulse response for room reverb
    const impulseLength = this.audioContext.sampleRate * 2 // 2 seconds
    const impulse = this.audioContext.createBuffer(2, impulseLength, this.audioContext.sampleRate)
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel)
      for (let i = 0; i < impulseLength; i++) {
        const decay = Math.pow(1 - i / impulseLength, 2)
        channelData[i] = (Math.random() * 2 - 1) * decay * 0.3
      }
    }
    
    this.reverbNode.buffer = impulse
    this.reverbNode.connect(this.masterGain!)
  }

  /**
   * 🎵 Create a positioned audio source in 3D space
   */
  async createSpatialSource(
    id: string, 
    position: THREE.Vector3, 
    type: SpatialAudioSource['type'],
    audioParams: {
      frequency?: number
      waveform?: 'sine' | 'square' | 'sawtooth' | 'triangle'
      envelope?: { attack: number, decay: number, sustain: number, release: number }
    } = {}
  ): Promise<SpatialAudioSource | null> {
    
    if (!this.audioContext || !this.masterGain) {
      console.warn('Spatial audio engine not initialized')
      return null
    }

    try {
      // Create Web Audio API nodes for spatial positioning
      const pannerNode = this.audioContext.createPanner()
      const gainNode = this.audioContext.createGain()

      // Configure panner for 3D audio
      pannerNode.panningModel = 'HRTF' // Head-Related Transfer Function for realism
      pannerNode.distanceModel = 'inverse'
      pannerNode.refDistance = 1
      pannerNode.maxDistance = 100
      pannerNode.rolloffFactor = 1
      pannerNode.coneInnerAngle = 360
      pannerNode.coneOuterAngle = 0
      pannerNode.coneOuterGain = 0

      // Set initial position
      pannerNode.positionX.value = position.x
      pannerNode.positionY.value = position.y
      pannerNode.positionZ.value = position.z

      // Connect audio chain: source -> gain -> panner -> reverb -> master
      gainNode.connect(pannerNode)
      pannerNode.connect(this.reverbNode!)
      pannerNode.connect(this.masterGain)

      // Create Tone.js synth based on type
      const Tone = getTone()!
      let audioNode: any

      const { frequency = 440, waveform = 'sine', envelope } = audioParams

      switch (type) {
        case 'note':
          audioNode = new Tone.Synth({
            oscillator: { type: waveform },
            envelope: envelope || { attack: 0.1, decay: 0.2, sustain: 0.8, release: 0.5 }
          })
          break
        case 'chord':
          audioNode = new Tone.PolySynth()
          break
        case 'beat':
          audioNode = new Tone.MembraneSynth()
          break
        case 'ambient':
          audioNode = new Tone.Synth({
            oscillator: { type: 'sine' },
            envelope: { attack: 2, decay: 1, sustain: 0.8, release: 3 }
          })
          break
      }

      // Connect Tone.js to Web Audio API
      audioNode.connect(gainNode)

      const source: SpatialAudioSource = {
        id,
        position: position.clone(),
        velocity: new THREE.Vector3(),
        audioNode,
        pannerNode,
        gainNode,
        isPlaying: false,
        frequency,
        type,
        visualEffect: {
          color: this.getTypeColor(type),
          intensity: 0,
          radius: 2
        }
      }

      this.sources.set(id, source)
      console.log(`🎵 Created spatial audio source: ${id} at position`, position)
      
      return source

    } catch (error) {
      console.error(`Failed to create spatial source ${id}:`, error)
      return null
    }
  }

  /**
   * 🔊 Play a spatial audio source with 3D positioning
   */
  async playSpatialSound(
    id: string, 
    note?: string | string[], 
    duration: string = '4n',
    options: {
      velocity?: number
      delay?: number
      fadeIn?: number
    } = {}
  ): Promise<boolean> {
    
    const source = this.sources.get(id)
    if (!source) {
      console.warn(`Spatial source ${id} not found`)
      return false
    }

    try {
      const { velocity = 0.8, delay = 0, fadeIn = 0 } = options
      const Tone = getTone()!
      const now = Tone.now() + delay

      // Update visual effect intensity
      if (source.visualEffect) {
        source.visualEffect.intensity = velocity
      }

      // Apply distance-based volume
      const distance = this.listenerProps.position.distanceTo(source.position)
      const volumeMultiplier = Math.max(0.1, 1 / (1 + distance * 0.1))
      source.gainNode.gain.setValueAtTime(velocity * volumeMultiplier, now)

      if (fadeIn > 0) {
        source.gainNode.gain.linearRampToValueAtTime(velocity * volumeMultiplier, now + fadeIn)
      }

      // Play based on source type
      switch (source.type) {
        case 'note':
          source.audioNode.triggerAttackRelease(note || 'C4', duration, now)
          break
        case 'chord':
          const chordNotes = Array.isArray(note) ? note : ['C4', 'E4', 'G4']
          source.audioNode.triggerAttackRelease(chordNotes, duration, now)
          break
        case 'beat':
          source.audioNode.triggerAttackRelease('C2', duration, now)
          break
        case 'ambient':
          source.audioNode.triggerAttack(note || 'C3', now)
          // Ambient sounds don't auto-release
          break
      }

      source.isPlaying = true

      // Dispatch spatial audio event for visual feedback
      document.dispatchEvent(new CustomEvent('spatial-audio-triggered', {
        detail: { 
          id, 
          position: source.position.clone(), 
          type: source.type,
          visualEffect: source.visualEffect
        }
      }))

      return true

    } catch (error) {
      console.error(`Failed to play spatial sound ${id}:`, error)
      return false
    }
  }

  /**
   * 🎮 Update listener position (camera/user position)
   */
  updateListenerPosition(position?: THREE.Vector3, orientation?: THREE.Vector3) {
    if (!this.listener) return

    if (position) {
      this.listenerProps.position.copy(position)
      this.listener.positionX.value = position.x
      this.listener.positionY.value = position.y
      this.listener.positionZ.value = position.z
    }

    if (orientation) {
      this.listenerProps.orientation.copy(orientation)
      this.listener.forwardX.value = orientation.x
      this.listener.forwardY.value = orientation.y
      this.listener.forwardZ.value = orientation.z
    }

    // Update all sources based on new listener position
    this.updateAllSourceVolumes()
  }

  /**
   * 🏃‍♂️ Move audio source in 3D space with physics
   */
  moveSpatialSource(
    id: string, 
    newPosition: THREE.Vector3, 
    duration: number = 1,
    easing: 'linear' | 'easeInOut' | 'bounce' = 'easeInOut'
  ) {
    const source = this.sources.get(id)
    if (!source) return

    const startPosition = source.position.clone()
    const startTime = performance.now()

    const animate = () => {
      const elapsed = (performance.now() - startTime) / 1000
      const progress = Math.min(elapsed / duration, 1)

      let easedProgress = progress
      switch (easing) {
        case 'easeInOut':
          easedProgress = progress * progress * (3 - 2 * progress)
          break
        case 'bounce':
          easedProgress = progress < 0.5 
            ? 2 * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 2) / 2
          break
      }

      // Interpolate position
      source.position.lerpVectors(startPosition, newPosition, easedProgress)
      
      // Update panner position
      source.pannerNode.positionX.value = source.position.x
      source.pannerNode.positionY.value = source.position.y
      source.pannerNode.positionZ.value = source.position.z

      // Update volume based on distance
      const distance = this.listenerProps.position.distanceTo(source.position)
      const volumeMultiplier = Math.max(0.1, 1 / (1 + distance * 0.1))
      source.gainNode.gain.value = volumeMultiplier

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    animate()
  }

  /**
   * 🎨 Get color based on audio source type
   */
  private getTypeColor(type: SpatialAudioSource['type']): string {
    const colors = {
      note: '#00d9ff',      // Cyan for notes
      chord: '#ff006e',     // Pink for chords  
      beat: '#ffbe0b',      // Yellow for beats
      ambient: '#7209b7'    // Purple for ambient
    }
    return colors[type]
  }

  /**
   * 📊 Update all source volumes based on distance
   */
  private updateAllSourceVolumes() {
    this.sources.forEach(source => {
      const distance = this.listenerProps.position.distanceTo(source.position)
      const volumeMultiplier = Math.max(0.1, 1 / (1 + distance * 0.1))
      source.gainNode.gain.value = volumeMultiplier
    })
  }

  /**
   * 🌊 Get spatial frequency data for visualization
   */
  getSpatialFrequencyData(): { 
    spectrum: Uint8Array
    sources: Array<{
      id: string
      position: THREE.Vector3
      intensity: number
      color: string
      type: string
    }>
  } {
    const spectrum = new Uint8Array(this.analyser?.frequencyBinCount || 256)
    if (this.analyser) {
      this.analyser.getByteFrequencyData(spectrum)
    }

    const sources = Array.from(this.sources.values()).map(source => ({
      id: source.id,
      position: source.position.clone(),
      intensity: source.visualEffect?.intensity || 0,
      color: source.visualEffect?.color || '#ffffff',
      type: source.type
    }))

    return { spectrum, sources }
  }

  /**
   * 🧹 Clean up spatial source
   */
  removeSpatialSource(id: string) {
    const source = this.sources.get(id)
    if (source) {
      source.audioNode.disconnect()
      source.gainNode.disconnect()
      source.pannerNode.disconnect()
      this.sources.delete(id)
      console.log(`🗑️ Removed spatial source: ${id}`)
    }
  }

  /**
   * 📍 Get all active spatial sources
   */
  getAllSpatialSources(): Map<string, SpatialAudioSource> {
    return new Map(this.sources)
  }
}

// Export singleton instance
export const spatialAudioEngine = SpatialAudioEngine.getInstance()
export type { SpatialAudioSource, ListenerProperties }