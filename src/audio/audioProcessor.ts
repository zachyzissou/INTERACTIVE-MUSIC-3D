/**
 * Advanced Audio Processor for Oscillo
 * Handles real-time audio analysis, feature extraction, and reactive processing
 */

import * as Tone from 'tone'

export interface AudioFeatures {
  // Basic frequency analysis
  bassEnergy: number
  midEnergy: number
  highEnergy: number
  
  // Advanced features
  spectralCentroid: number
  spectralRolloff: number
  zeroCrossingRate: number
  rms: number
  mfcc: number[]
  
  // Beat and rhythm
  beatDetected: boolean
  tempo: number
  onsetStrength: number
  
  // Harmonic analysis
  pitch: number
  harmonicRatio: number
  inharmonicity: number
}

export interface AudioConfig {
  fftSize: number
  smoothingTimeConstant: number
  minDecibels: number
  maxDecibels: number
  sampleRate: number
}

export class AudioProcessor {
  private audioContext: AudioContext | null = null
  private analyserNode: AnalyserNode | null = null
  private sourceNode: MediaElementAudioSourceNode | null = null
  private frequencyData: Uint8Array | null = null
  private timeData: Uint8Array | null = null
  
  // Feature extraction buffers
  private previousEnergyBuffer: number[] = []
  private beatTracker: number[] = []
  private spectralHistory: number[][] = []
  
  // Configuration
  private config: AudioConfig = {
    fftSize: 2048,
    smoothingTimeConstant: 0.8,
    minDecibels: -90,
    maxDecibels: -10,
    sampleRate: 44100
  }
  
  // Callback functions
  private onFeaturesUpdate?: (features: AudioFeatures) => void
  private onFrequencyData?: (data: Uint8Array) => void
  private onBeatDetected?: (strength: number) => void

  constructor(config?: Partial<AudioConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }
  }

  /**
   * Initialize audio processing
   */
  async initialize(): Promise<boolean> {
    try {
      // Initialize audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      // Create analyser node
      this.analyserNode = this.audioContext.createAnalyser()
      this.analyserNode.fftSize = this.config.fftSize
      this.analyserNode.smoothingTimeConstant = this.config.smoothingTimeConstant
      this.analyserNode.minDecibels = this.config.minDecibels
      this.analyserNode.maxDecibels = this.config.maxDecibels

      // Initialize data arrays
      this.frequencyData = new Uint8Array(this.analyserNode.frequencyBinCount)
      this.timeData = new Uint8Array(this.analyserNode.frequencyBinCount)

      // Initialize buffers
      this.previousEnergyBuffer = new Array(10).fill(0)
      this.beatTracker = new Array(20).fill(0)
      this.spectralHistory = []

      console.warn('AudioProcessor initialized successfully')
      return true

    } catch (error) {
      console.error('Failed to initialize AudioProcessor:', error)
      return false
    }
  }

  /**
   * Connect to Tone.js master output
   */
  connectToTone(): boolean {
    try {
      if (!this.audioContext || !this.analyserNode) {
        throw new Error('AudioProcessor not initialized')
      }

      // Connect to Tone.js destination
      const toneDestination = Tone.getDestination()
      if (toneDestination.context.rawContext !== this.audioContext) {
        console.warn('Audio context mismatch with Tone.js')
      }

      // Connect analyser to Tone destination
      const gainNode = this.audioContext.createGain()
      gainNode.gain.value = 1.0
      gainNode.connect(this.analyserNode)
      
      // Note: This requires accessing Tone's internal structure
      // In production, you might need a different approach
      
      return true
    } catch (error) {
      console.error('Failed to connect to Tone.js:', error)
      return false
    }
  }

  /**
   * Connect to audio source element
   */
  connectToAudioElement(audioElement: HTMLAudioElement): boolean {
    try {
      if (!this.audioContext || !this.analyserNode) {
        throw new Error('AudioProcessor not initialized')
      }

      // Disconnect previous source
      if (this.sourceNode) {
        this.sourceNode.disconnect()
      }

      // Create source from audio element
      this.sourceNode = this.audioContext.createMediaElementSource(audioElement)
      this.sourceNode.connect(this.analyserNode)
      this.analyserNode.connect(this.audioContext.destination)

      return true
    } catch (error) {
      console.error('Failed to connect audio element:', error)
      return false
    }
  }

  /**
   * Start real-time analysis
   */
  startAnalysis(): void {
    if (!this.analyserNode || !this.frequencyData || !this.timeData) {
      console.error('AudioProcessor not properly initialized')
      return
    }

    const analyze = () => {
      // Get frequency and time domain data
      this.analyserNode!.getByteFrequencyData(this.frequencyData!)
      this.analyserNode!.getByteTimeDomainData(this.timeData!)

      // Extract features
      const features = this.extractFeatures(this.frequencyData!, this.timeData!)

      // Notify callbacks
      if (this.onFeaturesUpdate) {
        this.onFeaturesUpdate(features)
      }

      if (this.onFrequencyData) {
        this.onFrequencyData(this.frequencyData!)
      }

      if (features.beatDetected && this.onBeatDetected) {
        this.onBeatDetected(features.onsetStrength)
      }

      // Continue analysis
      requestAnimationFrame(analyze)
    }

    analyze()
  }

  /**
   * Extract audio features from frequency and time data
   */
  private extractFeatures(frequencyData: Uint8Array, timeData: Uint8Array): AudioFeatures {
    const features: AudioFeatures = {
      bassEnergy: 0,
      midEnergy: 0,
      highEnergy: 0,
      spectralCentroid: 0,
      spectralRolloff: 0,
      zeroCrossingRate: 0,
      rms: 0,
      mfcc: [],
      beatDetected: false,
      tempo: 0,
      onsetStrength: 0,
      pitch: 0,
      harmonicRatio: 0,
      inharmonicity: 0
    }

    // Basic frequency band analysis
    const bassRange = Math.floor(frequencyData.length * 0.1) // 0-10%
    const midRange = Math.floor(frequencyData.length * 0.5)  // 10-50%
    const highRange = frequencyData.length                    // 50-100%

    // Calculate energy in frequency bands
    for (let i = 0; i < bassRange; i++) {
      features.bassEnergy += frequencyData[i]
    }
    features.bassEnergy /= (bassRange * 255)

    for (let i = bassRange; i < midRange; i++) {
      features.midEnergy += frequencyData[i]
    }
    features.midEnergy /= ((midRange - bassRange) * 255)

    for (let i = midRange; i < highRange; i++) {
      features.highEnergy += frequencyData[i]
    }
    features.highEnergy /= ((highRange - midRange) * 255)

    // Spectral centroid
    let weightedSum = 0
    let magnitudeSum = 0
    for (let i = 0; i < frequencyData.length; i++) {
      const magnitude = frequencyData[i] / 255
      const frequency = (i * this.config.sampleRate) / (2 * frequencyData.length)
      weightedSum += frequency * magnitude
      magnitudeSum += magnitude
    }
    features.spectralCentroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0

    // Spectral rolloff (90% of energy)
    const targetEnergy = magnitudeSum * 0.9
    let cumulativeEnergy = 0
    for (let i = 0; i < frequencyData.length; i++) {
      cumulativeEnergy += frequencyData[i] / 255
      if (cumulativeEnergy >= targetEnergy) {
        features.spectralRolloff = (i * this.config.sampleRate) / (2 * frequencyData.length)
        break
      }
    }

    // Zero crossing rate
    let zeroCrossings = 0
    for (let i = 1; i < timeData.length; i++) {
      if ((timeData[i] > 128 && timeData[i-1] <= 128) || 
          (timeData[i] <= 128 && timeData[i-1] > 128)) {
        zeroCrossings++
      }
    }
    features.zeroCrossingRate = zeroCrossings / timeData.length

    // RMS energy
    let rmsSum = 0
    for (let i = 0; i < timeData.length; i++) {
      const sample = (timeData[i] - 128) / 128
      rmsSum += sample * sample
    }
    features.rms = Math.sqrt(rmsSum / timeData.length)

    // Beat detection (simple energy-based)
    const currentEnergy = features.bassEnergy + features.midEnergy + features.highEnergy
    this.previousEnergyBuffer.push(currentEnergy)
    if (this.previousEnergyBuffer.length > 10) {
      this.previousEnergyBuffer.shift()
    }

    const avgEnergy = this.previousEnergyBuffer.reduce((a, b) => a + b, 0) / this.previousEnergyBuffer.length
    const variance = this.previousEnergyBuffer.reduce((sum, energy) => {
      return sum + Math.pow(energy - avgEnergy, 2)
    }, 0) / this.previousEnergyBuffer.length

    const threshold = avgEnergy + Math.sqrt(variance) * 2
    features.beatDetected = currentEnergy > threshold && currentEnergy > 0.1
    features.onsetStrength = Math.max(0, currentEnergy - threshold)

    // Update spectral history for MFCC and other features
    this.spectralHistory.push(Array.from(frequencyData))
    if (this.spectralHistory.length > 20) {
      this.spectralHistory.shift()
    }

    // Basic pitch detection (highest peak)
    let maxMagnitude = 0
    let maxIndex = 0
    for (let i = 1; i < frequencyData.length / 2; i++) {
      if (frequencyData[i] > maxMagnitude) {
        maxMagnitude = frequencyData[i]
        maxIndex = i
      }
    }
    features.pitch = (maxIndex * this.config.sampleRate) / (2 * frequencyData.length)

    return features
  }

  /**
   * Set callback for features updates
   */
  onFeatures(callback: (features: AudioFeatures) => void): void {
    this.onFeaturesUpdate = callback
  }

  /**
   * Set callback for frequency data updates
   */
  onFrequencyUpdate(callback: (data: Uint8Array) => void): void {
    this.onFrequencyData = callback
  }

  /**
   * Set callback for beat detection
   */
  onBeat(callback: (strength: number) => void): void {
    this.onBeatDetected = callback
  }

  /**
   * Get current audio context
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext
  }

  /**
   * Get analyser node
   */
  getAnalyserNode(): AnalyserNode | null {
    return this.analyserNode
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    if (this.sourceNode) {
      this.sourceNode.disconnect()
      this.sourceNode = null
    }

    if (this.analyserNode) {
      this.analyserNode.disconnect()
      this.analyserNode = null
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
      this.audioContext = null
    }

    this.frequencyData = null
    this.timeData = null
    this.previousEnergyBuffer = []
    this.beatTracker = []
    this.spectralHistory = []
  }
}

// Singleton instance
let globalAudioProcessor: AudioProcessor | null = null

export function getAudioProcessor(): AudioProcessor {
  if (!globalAudioProcessor) {
    globalAudioProcessor = new AudioProcessor()
  }
  return globalAudioProcessor
}

export function initializeAudioProcessor(): Promise<boolean> {
  const processor = getAudioProcessor()
  return processor.initialize()
}