/**
 * 🎭 REVOLUTIONARY GESTURE-BASED MUSIC COMPOSER
 * 
 * This system transforms human gestures into musical expressions using
 * advanced motion analysis, pattern recognition, and real-time composition.
 * 
 * Inspired by: Minority Report + Brian Eno + Theremin + Motion Capture Studios
 */

import * as THREE from 'three'
import { spatialAudioEngine } from './spatialAudioEngine'

interface GesturePoint {
  position: THREE.Vector2
  timestamp: number
  pressure: number // For touch/stylus pressure
  velocity: THREE.Vector2
  acceleration: THREE.Vector2
}

interface MusicalGesture {
  id: string
  type: 'sweep' | 'tap' | 'hold' | 'spiral' | 'shake' | 'draw'
  path: GesturePoint[]
  startTime: number
  endTime: number
  boundingBox: THREE.Box2
  centroid: THREE.Vector2
  totalDistance: number
  averageVelocity: number
  musicalProperties: {
    pitch: number[]        // MIDI note numbers
    rhythm: number[]       // Note durations
    dynamics: number[]     // Volume levels
    timbre: string         // Waveform type
    harmony: string[]      // Chord progression
  }
}

interface GestureToMusicMapping {
  gestureType: MusicalGesture['type']
  musicalResponse: {
    scaleType: 'major' | 'minor' | 'pentatonic' | 'chromatic' | 'dorian' | 'mixolydian'
    chordProgression: string[]
    rhythmPattern: number[]
    spatialMapping: 'position' | 'velocity' | 'acceleration' | 'path'
  }
}

class GestureComposer {
  private static instance: GestureComposer
  private canvas: HTMLCanvasElement | null = null
  private isRecording = false
  private currentGesture: GesturePoint[] = []
  private completedGestures: MusicalGesture[] = []
  private gestureStartTime = 0
  
  // Musical scales and progressions
  private scales = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    pentatonic: [0, 2, 4, 7, 9],
    chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    mixolydian: [0, 2, 4, 5, 7, 9, 10]
  }

  private chordProgressions = {
    classic: ['C', 'Am', 'F', 'G'],
    jazz: ['Cmaj7', 'A7', 'Dm7', 'G7'],
    modern: ['C', 'G/B', 'Am', 'F'],
    ambient: ['Csus2', 'Fsus2', 'Gsus4', 'Am7']
  }

  // Gesture recognition parameters
  private velocityThreshold = 0.5
  private holdThreshold = 500 // milliseconds
  private tapThreshold = 150 // milliseconds
  private spiralThreshold = Math.PI * 1.5 // radians

  private constructor() {}

  static getInstance(): GestureComposer {
    if (!GestureComposer.instance) {
      GestureComposer.instance = new GestureComposer()
    }
    return GestureComposer.instance
  }

  /**
   * 🎮 Initialize gesture tracking on a canvas element
   */
  initialize(canvas: HTMLCanvasElement): boolean {
    try {
      this.canvas = canvas
      this.setupEventListeners()
      console.log('🎭 Gesture Composer initialized')
      return true
    } catch (error) {
      console.error('Failed to initialize Gesture Composer:', error)
      return false
    }
  }

  private setupEventListeners() {
    if (!this.canvas) return

    // Mouse events
    this.canvas.addEventListener('mousedown', this.handleInputStart.bind(this))
    this.canvas.addEventListener('mousemove', this.handleInputMove.bind(this))
    this.canvas.addEventListener('mouseup', this.handleInputEnd.bind(this))

    // Touch events for mobile
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false })
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false })
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false })

    console.log('🎭 Gesture event listeners setup complete')
  }

  private handleInputStart(event: MouseEvent) {
    this.startGestureRecording(
      new THREE.Vector2(event.clientX, event.clientY),
      1.0 // Default pressure for mouse
    )
  }

  private handleInputMove(event: MouseEvent) {
    if (this.isRecording) {
      this.addGesturePoint(
        new THREE.Vector2(event.clientX, event.clientY),
        1.0
      )
    }
  }

  private handleInputEnd(event: MouseEvent) {
    this.endGestureRecording()
  }

  private handleTouchStart(event: TouchEvent) {
    event.preventDefault()
    const touch = event.touches[0]
    this.startGestureRecording(
      new THREE.Vector2(touch.clientX, touch.clientY),
      (touch as any).force || 1.0 // Use force if available
    )
  }

  private handleTouchMove(event: TouchEvent) {
    event.preventDefault()
    if (this.isRecording && event.touches.length > 0) {
      const touch = event.touches[0]
      this.addGesturePoint(
        new THREE.Vector2(touch.clientX, touch.clientY),
        (touch as any).force || 1.0
      )
    }
  }

  private handleTouchEnd(event: TouchEvent) {
    event.preventDefault()
    this.endGestureRecording()
  }

  /**
   * 🎬 Start recording a gesture
   */
  private startGestureRecording(position: THREE.Vector2, pressure: number) {
    this.isRecording = true
    this.currentGesture = []
    this.gestureStartTime = performance.now()

    this.addGesturePoint(position, pressure)
    console.log('🎬 Started gesture recording at', position)
  }

  /**
   * 📍 Add a point to the current gesture
   */
  private addGesturePoint(position: THREE.Vector2, pressure: number) {
    if (!this.isRecording) return

    const timestamp = performance.now()
    const lastPoint = this.currentGesture[this.currentGesture.length - 1]

    let velocity = new THREE.Vector2()
    let acceleration = new THREE.Vector2()

    if (lastPoint) {
      const timeDelta = (timestamp - lastPoint.timestamp) / 1000 // Convert to seconds
      if (timeDelta > 0) {
        velocity = position.clone().sub(lastPoint.position).divideScalar(timeDelta)
        acceleration = velocity.clone().sub(lastPoint.velocity).divideScalar(timeDelta)
      }
    }

    const gesturePoint: GesturePoint = {
      position: position.clone(),
      timestamp,
      pressure,
      velocity,
      acceleration
    }

    this.currentGesture.push(gesturePoint)
  }

  /**
   * 🎵 End gesture recording and convert to music
   */
  private async endGestureRecording() {
    if (!this.isRecording || this.currentGesture.length < 2) {
      this.isRecording = false
      return
    }

    this.isRecording = false
    const endTime = performance.now()

    // Analyze the gesture
    const musicalGesture = this.analyzeGesture(this.currentGesture, this.gestureStartTime, endTime)
    
    // Convert gesture to music
    await this.playGestureAsMusic(musicalGesture)
    
    // Store gesture for pattern learning
    this.completedGestures.push(musicalGesture)
    
    console.log('🎵 Gesture converted to music:', musicalGesture.type)
    
    // Dispatch custom event for visual feedback
    document.dispatchEvent(new CustomEvent('gesture-composed', {
      detail: { gesture: musicalGesture }
    }))
  }

  /**
   * 🔍 Analyze gesture characteristics
   */
  private analyzeGesture(points: GesturePoint[], startTime: number, endTime: number): MusicalGesture {
    const duration = endTime - startTime
    const boundingBox = this.calculateBoundingBox(points)
    const centroid = this.calculateCentroid(points)
    const totalDistance = this.calculateTotalDistance(points)
    const averageVelocity = totalDistance / (duration / 1000)

    // Classify gesture type
    const gestureType = this.classifyGesture(points, duration, totalDistance, averageVelocity)
    
    // Generate musical properties based on gesture
    const musicalProperties = this.generateMusicalProperties(points, gestureType, boundingBox, averageVelocity)

    const gesture: MusicalGesture = {
      id: `gesture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: gestureType,
      path: [...points],
      startTime,
      endTime,
      boundingBox,
      centroid,
      totalDistance,
      averageVelocity,
      musicalProperties
    }

    return gesture
  }

  /**
   * 🎭 Classify gesture into musical categories
   */
  private classifyGesture(
    points: GesturePoint[], 
    duration: number, 
    totalDistance: number, 
    averageVelocity: number
  ): MusicalGesture['type'] {
    
    // Quick tap
    if (duration < this.tapThreshold && totalDistance < 50) {
      return 'tap'
    }

    // Hold gesture (minimal movement)
    if (duration > this.holdThreshold && totalDistance < 100) {
      return 'hold'
    }

    // Check for spiral pattern
    if (this.isSpiral(points)) {
      return 'spiral'
    }

    // Check for shake pattern (rapid back-and-forth)
    if (this.isShake(points, averageVelocity)) {
      return 'shake'
    }

    // Long drawing gesture
    if (totalDistance > 200 && duration > 500) {
      return 'draw'
    }

    // Default to sweep
    return 'sweep'
  }

  /**
   * 🌀 Detect spiral patterns
   */
  private isSpiral(points: GesturePoint[]): boolean {
    if (points.length < 10) return false

    let totalAngleChange = 0
    const center = this.calculateCentroid(points)

    for (let i = 2; i < points.length; i++) {
      const prev = points[i - 1].position.clone().sub(center)
      const curr = points[i].position.clone().sub(center)
      
      const angle1 = Math.atan2(prev.y, prev.x)
      const angle2 = Math.atan2(curr.y, curr.x)
      
      let angleDiff = angle2 - angle1
      if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI
      if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI
      
      totalAngleChange += Math.abs(angleDiff)
    }

    return totalAngleChange > this.spiralThreshold
  }

  /**
   * 🤝 Detect shake patterns
   */
  private isShake(points: GesturePoint[], averageVelocity: number): boolean {
    if (points.length < 6 || averageVelocity < this.velocityThreshold) return false

    let directionChanges = 0
    
    for (let i = 2; i < points.length; i++) {
      const prev = points[i - 1].velocity
      const curr = points[i].velocity
      
      // Check for significant direction change
      if (prev.dot(curr) < 0) {
        directionChanges++
      }
    }

    return directionChanges > points.length * 0.3 // 30% direction changes
  }

  /**
   * 🎼 Generate musical properties from gesture
   */
  private generateMusicalProperties(
    points: GesturePoint[], 
    gestureType: MusicalGesture['type'], 
    boundingBox: THREE.Box2, 
    averageVelocity: number
  ): MusicalGesture['musicalProperties'] {
    
    const width = boundingBox.max.x - boundingBox.min.x
    const height = boundingBox.max.y - boundingBox.min.y
    
    // Map gesture dimensions to musical parameters
    const baseNote = 60 // Middle C
    const scaleRange = 24 // Two octaves
    
    // Generate pitch sequence based on Y positions
    const pitches = points.map(point => {
      const normalizedY = (boundingBox.max.y - point.position.y) / height
      return Math.round(baseNote + normalizedY * scaleRange)
    }).filter((pitch, index, array) => index === 0 || pitch !== array[index - 1]) // Remove duplicates

    // Generate rhythm based on velocity and gesture type
    const rhythms = this.generateRhythmPattern(points, gestureType)
    
    // Generate dynamics based on pressure and velocity
    const dynamics = points.map(point => 
      Math.min(1.0, (point.pressure * 0.5 + point.velocity.length() * 0.01))
    )

    // Select timbre based on gesture characteristics
    const timbre = this.selectTimbre(gestureType, averageVelocity, width, height)
    
    // Generate harmony based on gesture type
    const harmony = this.generateHarmony(gestureType, pitches[0] || baseNote)

    return {
      pitch: pitches,
      rhythm: rhythms,
      dynamics,
      timbre,
      harmony
    }
  }

  /**
   * 🥁 Generate rhythm patterns
   */
  private generateRhythmPattern(points: GesturePoint[], gestureType: MusicalGesture['type']): number[] {
    const baseRhythms = {
      tap: [0.25], // Quick sixteenth note
      hold: [2.0], // Half note
      sweep: [0.5, 0.25, 0.25], // Quarter + two eighths
      spiral: [0.125, 0.125, 0.25, 0.5], // Accelerating pattern
      shake: Array(8).fill(0.125), // Rapid eighths
      draw: points.map(() => 0.25) // Quarter notes for each point
    }

    return baseRhythms[gestureType] || [0.5]
  }

  /**
   * 🎨 Select timbre based on gesture
   */
  private selectTimbre(
    gestureType: MusicalGesture['type'], 
    velocity: number, 
    width: number, 
    height: number
  ): string {
    
    const timbres = {
      tap: velocity > 2 ? 'square' : 'sine',
      hold: 'sine',
      sweep: width > height ? 'sawtooth' : 'triangle',
      spiral: 'sine', // Ethereal for spirals
      shake: 'square', // Aggressive for shakes
      draw: 'triangle' // Smooth for drawing
    }

    return timbres[gestureType] || 'sine'
  }

  /**
   * 🎵 Generate harmony progressions
   */
  private generateHarmony(gestureType: MusicalGesture['type'], rootNote: number): string[] {
    const progressions = {
      tap: [`${this.noteToString(rootNote)}`], // Single note
      hold: [`${this.noteToString(rootNote)}sus2`], // Suspended chord
      sweep: ['C', 'F', 'G'], // Simple progression
      spiral: ['Cmaj7', 'Fmaj7', 'G7'], // Complex jazz chords
      shake: ['C', 'C#dim', 'Dm'], // Dissonant progression
      draw: ['C', 'Am', 'F', 'G'] // Classic progression
    }

    return progressions[gestureType] || ['C']
  }

  /**
   * 🎶 Play gesture as spatial music
   */
  private async playGestureAsMusic(gesture: MusicalGesture) {
    const { musicalProperties, boundingBox, path } = gesture

    // Initialize spatial audio if needed
    await spatialAudioEngine.initialize()

    for (let i = 0; i < musicalProperties.pitch.length; i++) {
      const pitch = musicalProperties.pitch[i]
      const rhythm = musicalProperties.rhythm[i] || 0.5
      const dynamic = musicalProperties.dynamics[i] || 0.8

      // Convert 2D gesture position to 3D space
      const gesturePoint = path[Math.min(i, path.length - 1)]
      const normalizedX = (gesturePoint.position.x - boundingBox.min.x) / 
                         (boundingBox.max.x - boundingBox.min.x)
      const normalizedY = (gesturePoint.position.y - boundingBox.min.y) / 
                         (boundingBox.max.y - boundingBox.min.y)

      const spatialPosition = new THREE.Vector3(
        (normalizedX - 0.5) * 20, // -10 to +10
        (1 - normalizedY) * 10,   // 0 to 10 (inverted Y)
        -5 // Fixed Z depth
      )

      // Create spatial audio source
      const sourceId = `gesture_${gesture.id}_${i}`
      await spatialAudioEngine.createSpatialSource(
        sourceId,
        spatialPosition,
        'note',
        {
          frequency: this.midiToFrequency(pitch),
          waveform: musicalProperties.timbre as any,
          envelope: { attack: 0.1, decay: 0.3, sustain: 0.6, release: 0.8 }
        }
      )

      // Play the spatial sound
      setTimeout(async () => {
        await spatialAudioEngine.playSpatialSound(
          sourceId,
          this.noteToString(pitch),
          `${rhythm}n`,
          { velocity: dynamic, delay: 0.1 * i }
        )

        // Clean up after playing
        setTimeout(() => {
          spatialAudioEngine.removeSpatialSource(sourceId)
        }, rhythm * 2000) // Double the rhythm duration
      }, i * 100) // Slight delay between notes
    }
  }

  /**
   * 🔢 Utility functions
   */
  private calculateBoundingBox(points: GesturePoint[]): THREE.Box2 {
    const box = new THREE.Box2()
    points.forEach(point => box.expandByPoint(point.position))
    return box
  }

  private calculateCentroid(points: GesturePoint[]): THREE.Vector2 {
    const centroid = new THREE.Vector2()
    points.forEach(point => centroid.add(point.position))
    return centroid.divideScalar(points.length)
  }

  private calculateTotalDistance(points: GesturePoint[]): number {
    let totalDistance = 0
    for (let i = 1; i < points.length; i++) {
      totalDistance += points[i].position.distanceTo(points[i - 1].position)
    }
    return totalDistance
  }

  private midiToFrequency(midiNote: number): number {
    return 440 * Math.pow(2, (midiNote - 69) / 12)
  }

  private noteToString(midiNote: number): string {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const octave = Math.floor(midiNote / 12) - 1
    const note = noteNames[midiNote % 12]
    return `${note}${octave}`
  }

  /**
   * 📊 Get gesture analytics
   */
  getGestureAnalytics(): {
    totalGestures: number
    gestureTypes: Record<string, number>
    averageComplexity: number
    musicalRange: { min: number, max: number }
  } {
    const gestureTypes: Record<string, number> = {}
    let totalComplexity = 0
    let minPitch = Infinity
    let maxPitch = -Infinity

    this.completedGestures.forEach(gesture => {
      gestureTypes[gesture.type] = (gestureTypes[gesture.type] || 0) + 1
      totalComplexity += gesture.path.length
      
      gesture.musicalProperties.pitch.forEach(pitch => {
        minPitch = Math.min(minPitch, pitch)
        maxPitch = Math.max(maxPitch, pitch)
      })
    })

    return {
      totalGestures: this.completedGestures.length,
      gestureTypes,
      averageComplexity: totalComplexity / Math.max(this.completedGestures.length, 1),
      musicalRange: { min: minPitch, max: maxPitch }
    }
  }
}

// Export singleton instance
export const gestureComposer = GestureComposer.getInstance()
export type { MusicalGesture, GesturePoint }