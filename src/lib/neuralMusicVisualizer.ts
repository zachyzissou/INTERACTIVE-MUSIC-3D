/**
 * 🧠 NEURAL MUSIC VISUALIZATION ENGINE
 * 
 * This system visualizes music as living neural networks where:
 * - Notes become neurons that fire and pulse
 * - Harmonies create synaptic connections
 * - Rhythm drives the neural pulse rate
 * - Musical tension creates electromagnetic fields
 * 
 * Inspired by: Brain imaging + Particle physics + Music theory + AI visualization
 */

import * as THREE from 'three'
import { spatialAudioEngine } from './spatialAudioEngine'

interface MusicalNeuron {
  id: string
  position: THREE.Vector3
  frequency: number           // Musical frequency
  midiNote: number           // MIDI note number
  intensity: number          // Current activation level (0-1)
  connections: string[]      // Connected neuron IDs
  neuronType: 'note' | 'chord' | 'rhythm' | 'harmony'
  
  // Visual properties
  color: THREE.Color
  size: number
  pulserate: number
  
  // Physics properties
  velocity: THREE.Vector3
  acceleration: THREE.Vector3
  mass: number
  charge: number             // For electromagnetic simulation
  
  // Musical properties
  harmonicSeries: number[]   // Related frequencies
  chordTones: number[]       // If this is a chord neuron
  rhythmPattern: number[]    // If this is a rhythm neuron
}

interface SynapticConnection {
  id: string
  from: string               // Source neuron ID
  to: string                 // Target neuron ID
  strength: number           // Connection strength (0-1)
  connectionType: 'harmonic' | 'rhythmic' | 'melodic' | 'dissonant'
  
  // Visual properties
  color: THREE.Color
  thickness: number
  opacity: number
  animated: boolean
  
  // Musical properties
  interval: number           // Musical interval between notes
  consonance: number         // How consonant the interval is (0-1)
  tension: number            // Musical tension level (0-1)
}

interface NeuralField {
  center: THREE.Vector3
  radius: number
  fieldType: 'harmonic' | 'rhythmic' | 'tonal' | 'emotional'
  intensity: number
  color: THREE.Color
  particles: THREE.Vector3[] // Field effect particles
}

class NeuralMusicVisualizer {
  private static instance: NeuralMusicVisualizer
  private scene: THREE.Scene | null = null
  private neurons: Map<string, MusicalNeuron> = new Map()
  private connections: Map<string, SynapticConnection> = new Map()
  private neuralFields: Map<string, NeuralField> = new Map()
  
  // Visual elements
  private neuronMeshes: Map<string, THREE.Mesh> = new Map()
  private connectionLines: Map<string, THREE.Line> = new Map()
  private fieldEffects: Map<string, THREE.Points> = new Map()
  private particleSystem: THREE.Points | null = null
  
  // Physics simulation
  private readonly ATTRACTION_FORCE = 0.1
  private readonly REPULSION_FORCE = 0.05
  private readonly DAMPING = 0.98
  private readonly FIELD_STRENGTH = 2.0
  
  // Musical theory constants
  private readonly CONSONANCE_MAP: Record<number, number> = {
    0: 1.0,    // Unison
    7: 0.9,    // Perfect fifth
    12: 1.0,   // Octave
    4: 0.8,    // Major third
    3: 0.7,    // Minor third
    9: 0.8,    // Major sixth
    8: 0.7,    // Minor sixth
    5: 0.6,    // Perfect fourth
    2: 0.4,    // Major second
    10: 0.4,   // Minor seventh
    1: 0.2,    // Minor second
    6: 0.3,    // Tritone (devil's interval)
    11: 0.2,   // Major seventh
  }

  private constructor() {}

  static getInstance(): NeuralMusicVisualizer {
    if (!NeuralMusicVisualizer.instance) {
      NeuralMusicVisualizer.instance = new NeuralMusicVisualizer()
    }
    return NeuralMusicVisualizer.instance
  }

  /**
   * 🧠 Initialize the neural visualization system
   */
  async initialize(scene: THREE.Scene): Promise<boolean> {
    try {
      this.scene = scene
      
      // Create particle system for neural field effects
      await this.createParticleSystem()
      
      // Set up musical theory-based neural network
      await this.createFoundationalNeurons()
      
      // Connect neurons based on harmonic relationships
      this.createHarmonicConnections()
      
      console.log('🧠 Neural Music Visualizer initialized')
      return true
      
    } catch (error) {
      console.error('Failed to initialize Neural Music Visualizer:', error)
      return false
    }
  }

  /**
   * ✨ Create foundational particle system
   */
  private async createParticleSystem() {
    if (!this.scene) return

    const particleCount = 10000
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)

    for (let i = 0; i < particleCount; i++) {
      // Create particles in a sphere around origin
      const i3 = i * 3
      const radius = Math.random() * 50
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i3 + 2] = radius * Math.cos(phi)
      
      // Color based on position (frequency mapping)
      const normalizedHeight = (positions[i3 + 1] + 25) / 50
      colors[i3] = normalizedHeight     // Red increases with height
      colors[i3 + 1] = 0.3 + normalizedHeight * 0.7  // Green
      colors[i3 + 2] = 1.0 - normalizedHeight  // Blue decreases with height
      
      sizes[i] = Math.random() * 2 + 0.5
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const material = new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: this.createParticleTexture() },
        time: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        uniform float time;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          
          // Add pulsing effect based on time
          float pulse = sin(time * 2.0 + position.x * 0.1) * 0.5 + 0.5;
          gl_PointSize = size * (50.0 / -mvPosition.z) * (0.5 + pulse * 0.5);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D pointTexture;
        varying vec3 vColor;
        
        void main() {
          gl_FragColor = vec4(vColor, 1.0);
          gl_FragColor = gl_FragColor * texture2D(pointTexture, gl_PointCoord);
          
          if (gl_FragColor.a < 0.1) discard;
        }
      `,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      transparent: true,
      vertexColors: true
    })

    this.particleSystem = new THREE.Points(geometry, material)
    this.scene.add(this.particleSystem)
  }

  /**
   * 🎨 Create particle texture
   */
  private createParticleTexture(): THREE.Texture {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    
    const context = canvas.getContext('2d')!
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)')
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.4)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    
    context.fillStyle = gradient
    context.fillRect(0, 0, 64, 64)
    
    return new THREE.CanvasTexture(canvas)
  }

  /**
   * 🎼 Create foundational musical neurons
   */
  private async createFoundationalNeurons() {
    // Create neurons for the chromatic scale
    const rootFreq = 261.63 // Middle C
    const positions = this.generateCircularPositions(12, 15) // 12 semitones in a circle
    
    for (let i = 0; i < 12; i++) {
      const frequency = rootFreq * Math.pow(2, i / 12)
      const midiNote = 60 + i // C4 to B4
      
      const neuron: MusicalNeuron = {
        id: `chromatic_${i}`,
        position: positions[i],
        frequency,
        midiNote,
        intensity: 0,
        connections: [],
        neuronType: 'note',
        color: this.frequencyToColor(frequency),
        size: 1.0,
        pulserate: frequency / 100, // Visual pulse rate
        velocity: new THREE.Vector3(),
        acceleration: new THREE.Vector3(),
        mass: 1.0,
        charge: Math.sin(i * Math.PI / 6), // Varying charges for interesting physics
        harmonicSeries: this.generateHarmonicSeries(frequency),
        chordTones: [],
        rhythmPattern: []
      }
      
      this.neurons.set(neuron.id, neuron)
      await this.createNeuronMesh(neuron)
    }

    // Create chord neurons (triads)
    const chordPositions = this.generateCircularPositions(7, 25) // 7 chords in outer circle
    const chordTypes = [
      { name: 'I', notes: [0, 4, 7] },     // C major
      { name: 'ii', notes: [2, 5, 9] },    // D minor
      { name: 'iii', notes: [4, 7, 11] },  // E minor
      { name: 'IV', notes: [5, 9, 0] },    // F major
      { name: 'V', notes: [7, 11, 2] },    // G major
      { name: 'vi', notes: [9, 0, 4] },    // A minor
      { name: 'vii°', notes: [11, 2, 5] }  // B diminished
    ]

    for (let i = 0; i < chordTypes.length; i++) {
      const chord = chordTypes[i]
      const chordFreqs = chord.notes.map(note => rootFreq * Math.pow(2, note / 12))
      const avgFreq = chordFreqs.reduce((sum, freq) => sum + freq, 0) / chordFreqs.length

      const chordNeuron: MusicalNeuron = {
        id: `chord_${chord.name}`,
        position: chordPositions[i],
        frequency: avgFreq,
        midiNote: 60 + chord.notes[0], // Root note
        intensity: 0,
        connections: [],
        neuronType: 'chord',
        color: this.chordToColor(chord.notes),
        size: 1.5,
        pulserate: avgFreq / 150,
        velocity: new THREE.Vector3(),
        acceleration: new THREE.Vector3(),
        mass: 2.0, // Chords have more mass
        charge: 0.5,
        harmonicSeries: [],
        chordTones: chord.notes.map(note => 60 + note),
        rhythmPattern: []
      }

      this.neurons.set(chordNeuron.id, chordNeuron)
      await this.createNeuronMesh(chordNeuron)
    }
  }

  /**
   * 🔗 Create harmonic connections between neurons
   */
  private createHarmonicConnections() {
    const neuronArray = Array.from(this.neurons.values())
    
    for (let i = 0; i < neuronArray.length; i++) {
      for (let j = i + 1; j < neuronArray.length; j++) {
        const neuron1 = neuronArray[i]
        const neuron2 = neuronArray[j]
        
        // Calculate musical interval
        const interval = Math.abs(neuron1.midiNote - neuron2.midiNote) % 12
        const consonance = this.CONSONANCE_MAP[interval] || 0.1
        
        // Create connection if consonant enough
        if (consonance > 0.4) {
          const connectionId = `${neuron1.id}_${neuron2.id}`
          const connection: SynapticConnection = {
            id: connectionId,
            from: neuron1.id,
            to: neuron2.id,
            strength: consonance,
            connectionType: consonance > 0.8 ? 'harmonic' : 'melodic',
            color: this.intervalToColor(interval),
            thickness: consonance * 3,
            opacity: consonance * 0.8,
            animated: true,
            interval,
            consonance,
            tension: 1 - consonance
          }
          
          this.connections.set(connectionId, connection)
          this.createConnectionLine(connection)
          
          // Add bidirectional references
          neuron1.connections.push(neuron2.id)
          neuron2.connections.push(neuron1.id)
        }
      }
    }
  }

  /**
   * 🎵 Activate neuron based on musical input
   */
  activateNeuron(noteInfo: { 
    midiNote: number
    velocity: number
    frequency: number
    position?: THREE.Vector3 
  }): string | null {
    
    // Find closest existing neuron
    let closestNeuron: MusicalNeuron | null = null
    let closestDistance = Infinity
    
    for (const neuron of this.neurons.values()) {
      const distance = Math.abs(neuron.midiNote - noteInfo.midiNote)
      if (distance < closestDistance) {
        closestDistance = distance
        closestNeuron = neuron
      }
    }
    
    if (closestNeuron) {
      // Activate the neuron
      closestNeuron.intensity = Math.min(1.0, noteInfo.velocity)
      
      // Propagate activation to connected neurons
      this.propagateActivation(closestNeuron.id, noteInfo.velocity * 0.6)
      
      // Update visual representation
      this.updateNeuronVisuals(closestNeuron)
      
      // Create neural field effect
      this.createNeuralField(closestNeuron, noteInfo.velocity)
      
      return closestNeuron.id
    }
    
    return null
  }

  /**
   * 🌊 Propagate activation through neural network
   */
  private propagateActivation(sourceId: string, intensity: number) {
    const sourceNeuron = this.neurons.get(sourceId)
    if (!sourceNeuron) return
    
    sourceNeuron.connections.forEach(targetId => {
      const targetNeuron = this.neurons.get(targetId)
      const connection = this.connections.get(`${sourceId}_${targetId}`) || 
                        this.connections.get(`${targetId}_${sourceId}`)
      
      if (targetNeuron && connection) {
        // Activate target neuron based on connection strength
        const activationLevel = intensity * connection.strength * 0.8
        targetNeuron.intensity = Math.min(1.0, targetNeuron.intensity + activationLevel)
        
        // Update connection visual
        this.animateConnection(connection, activationLevel)
        this.updateNeuronVisuals(targetNeuron)
      }
    })
  }

  /**
   * ⚡ Create neural field effect
   */
  private createNeuralField(neuron: MusicalNeuron, intensity: number) {
    const fieldId = `field_${neuron.id}_${Date.now()}`
    
    const field: NeuralField = {
      center: neuron.position.clone(),
      radius: intensity * 10,
      fieldType: 'harmonic',
      intensity,
      color: neuron.color.clone(),
      particles: []
    }
    
    // Generate field particles
    const particleCount = Math.floor(intensity * 50)
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2
      const radius = Math.random() * field.radius
      const particle = new THREE.Vector3(
        field.center.x + Math.cos(angle) * radius,
        field.center.y + Math.sin(angle) * radius * 0.5,
        field.center.z + (Math.random() - 0.5) * 2
      )
      field.particles.push(particle)
    }
    
    this.neuralFields.set(fieldId, field)
    this.createFieldEffect(field)
    
    // Remove field after animation
    setTimeout(() => {
      this.removeFieldEffect(fieldId)
    }, 2000)
  }

  /**
   * 🔮 Update all neural visuals
   */
  update(deltaTime: number) {
    if (!this.scene) return
    
    // Update particle system time
    if (this.particleSystem && this.particleSystem.material) {
      const material = this.particleSystem.material as THREE.ShaderMaterial
      material.uniforms.time.value += deltaTime
    }
    
    // Update neuron physics and visuals
    this.neurons.forEach(neuron => {
      // Apply physics forces
      this.applyForces(neuron)
      
      // Update position
      neuron.velocity.add(neuron.acceleration.clone().multiplyScalar(deltaTime))
      neuron.velocity.multiplyScalar(this.DAMPING)
      neuron.position.add(neuron.velocity.clone().multiplyScalar(deltaTime))
      
      // Reset acceleration
      neuron.acceleration.set(0, 0, 0)
      
      // Decay intensity
      neuron.intensity *= 0.98
      
      // Update visual mesh
      this.updateNeuronVisuals(neuron)
    })
    
    // Update connections
    this.connections.forEach(connection => {
      this.updateConnectionVisuals(connection)
    })
    
    // Update neural fields
    this.neuralFields.forEach((field, fieldId) => {
      field.intensity *= 0.95
      field.radius *= 1.02
      
      if (field.intensity < 0.01) {
        this.removeFieldEffect(fieldId)
      }
    })
  }

  /**
   * ⚡ Apply physics forces to neurons
   */
  private applyForces(neuron: MusicalNeuron) {
    // Gravitational attraction to center
    const centerForce = new THREE.Vector3(0, 0, 0).sub(neuron.position)
    centerForce.multiplyScalar(this.ATTRACTION_FORCE * neuron.mass)
    neuron.acceleration.add(centerForce)
    
    // Inter-neuron forces
    this.neurons.forEach(otherNeuron => {
      if (otherNeuron.id === neuron.id) return
      
      const distance = neuron.position.distanceTo(otherNeuron.position)
      if (distance < 0.1) return // Avoid division by zero
      
      const direction = new THREE.Vector3().subVectors(neuron.position, otherNeuron.position)
      direction.normalize()
      
      // Coulomb-like force based on charges
      const force = (this.REPULSION_FORCE * neuron.charge * otherNeuron.charge) / (distance * distance)
      direction.multiplyScalar(force / neuron.mass)
      
      neuron.acceleration.add(direction)
    })
  }

  /**
   * 🎨 Utility functions for colors and positioning
   */
  private frequencyToColor(frequency: number): THREE.Color {
    // Map frequency to visible spectrum
    const normalizedFreq = (frequency - 261.63) / (523.25 - 261.63) // C4 to C5 range
    const hue = normalizedFreq * 0.8 // Map to 80% of hue spectrum
    return new THREE.Color().setHSL(hue, 0.8, 0.6)
  }

  private chordToColor(notes: number[]): THREE.Color {
    // Use the root note for base hue, adjust saturation for chord type
    const rootHue = (notes[0] / 12) * 0.8
    const saturation = notes.length > 3 ? 0.9 : 0.7 // More complex chords are more saturated
    return new THREE.Color().setHSL(rootHue, saturation, 0.5)
  }

  private intervalToColor(interval: number): THREE.Color {
    const consonance = this.CONSONANCE_MAP[interval] || 0.1
    const hue = consonance > 0.6 ? 0.3 : 0.0 // Green for consonant, red for dissonant
    return new THREE.Color().setHSL(hue, 0.8, 0.5)
  }

  private generateCircularPositions(count: number, radius: number): THREE.Vector3[] {
    const positions: THREE.Vector3[] = []
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      positions.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        0
      ))
    }
    return positions
  }

  private generateHarmonicSeries(fundamental: number): number[] {
    return Array.from({ length: 8 }, (_, i) => fundamental * (i + 1))
  }

  /**
   * 🎭 Visual mesh creation and updates
   */
  private async createNeuronMesh(neuron: MusicalNeuron) {
    if (!this.scene) return

    const geometry = new THREE.SphereGeometry(neuron.size, 16, 16)
    const material = new THREE.MeshBasicMaterial({
      color: neuron.color,
      transparent: true,
      opacity: 0.8
    })
    
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.copy(neuron.position)
    mesh.userData = { neuronId: neuron.id }
    
    this.scene.add(mesh)
    this.neuronMeshes.set(neuron.id, mesh)
  }

  private updateNeuronVisuals(neuron: MusicalNeuron) {
    const mesh = this.neuronMeshes.get(neuron.id)
    if (!mesh) return
    
    mesh.position.copy(neuron.position)
    
    // Pulsing effect based on intensity
    const pulseScale = 1 + neuron.intensity * 0.5
    mesh.scale.setScalar(pulseScale)
    
    // Opacity based on intensity
    const material = mesh.material as THREE.MeshBasicMaterial
    material.opacity = 0.5 + neuron.intensity * 0.5
    
    // Color intensity
    const intensityColor = neuron.color.clone()
    intensityColor.multiplyScalar(0.5 + neuron.intensity * 0.5)
    material.color.copy(intensityColor)
  }

  private createConnectionLine(connection: SynapticConnection) {
    if (!this.scene) return
    
    const fromNeuron = this.neurons.get(connection.from)
    const toNeuron = this.neurons.get(connection.to)
    if (!fromNeuron || !toNeuron) return
    
    const geometry = new THREE.BufferGeometry().setFromPoints([
      fromNeuron.position,
      toNeuron.position
    ])
    
    const material = new THREE.LineBasicMaterial({
      color: connection.color,
      transparent: true,
      opacity: connection.opacity,
      linewidth: connection.thickness
    })
    
    const line = new THREE.Line(geometry, material)
    this.scene.add(line)
    this.connectionLines.set(connection.id, line)
  }

  private updateConnectionVisuals(connection: SynapticConnection) {
    const line = this.connectionLines.get(connection.id)
    if (!line) return
    
    const fromNeuron = this.neurons.get(connection.from)
    const toNeuron = this.neurons.get(connection.to)
    if (!fromNeuron || !toNeuron) return
    
    // Update line positions
    const positions = [fromNeuron.position, toNeuron.position]
    line.geometry.setFromPoints(positions)
    
    // Update material based on activation
    const material = line.material as THREE.LineBasicMaterial
    const averageIntensity = (fromNeuron.intensity + toNeuron.intensity) / 2
    material.opacity = connection.opacity * (0.3 + averageIntensity * 0.7)
  }

  private animateConnection(connection: SynapticConnection, intensity: number) {
    const line = this.connectionLines.get(connection.id)
    if (!line) return
    
    const material = line.material as THREE.LineBasicMaterial
    
    // Pulse animation
    let pulseTime = 0
    const animate = () => {
      pulseTime += 0.1
      const pulse = Math.sin(pulseTime * 5) * 0.5 + 0.5
      material.opacity = connection.opacity * (0.5 + pulse * intensity)
      
      if (pulseTime < Math.PI * 2) {
        requestAnimationFrame(animate)
      }
    }
    animate()
  }

  private createFieldEffect(field: NeuralField) {
    // Implementation for field particle effects
    // This would create a particle system around the neuron
  }

  private removeFieldEffect(fieldId: string) {
    this.neuralFields.delete(fieldId)
    // Remove associated visual elements
  }

  /**
   * 📊 Get neural network analytics
   */
  getNeuralAnalytics(): {
    totalNeurons: number
    totalConnections: number
    averageActivation: number
    networkComplexity: number
    harmonicCenters: string[]
  } {
    const totalNeurons = this.neurons.size
    const totalConnections = this.connections.size
    
    let totalActivation = 0
    const harmonicCenters: string[] = []
    
    this.neurons.forEach(neuron => {
      totalActivation += neuron.intensity
      if (neuron.connections.length > 5) {
        harmonicCenters.push(neuron.id)
      }
    })
    
    return {
      totalNeurons,
      totalConnections,
      averageActivation: totalActivation / totalNeurons,
      networkComplexity: totalConnections / (totalNeurons * (totalNeurons - 1) / 2),
      harmonicCenters
    }
  }
}

// Export singleton instance
export const neuralMusicVisualizer = NeuralMusicVisualizer.getInstance()
export type { MusicalNeuron, SynapticConnection, NeuralField }