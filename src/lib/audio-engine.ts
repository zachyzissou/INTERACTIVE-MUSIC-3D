// src/lib/audio-engine.ts
// Alternative audio engine to replace @magenta/music with modern, secure implementation

export interface AudioNote {
  note: string
  pitch: number
  velocity: number
  time: number
  duration: number
}

export interface AudioSequence {
  notes: AudioNote[]
  bpm: number
  timeSignature: [number, number]
}

export class SecureAudioEngine {
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private oscillators: Map<string, OscillatorNode> = new Map()
  private gainNodes: Map<string, GainNode> = new Map()

  async initialize(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 256
      this.analyser.connect(this.audioContext.destination)
    } catch (error) {
      console.error('Failed to initialize audio engine:', error)
      throw new Error('Audio engine initialization failed')
    }
  }

  getFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(128)
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount)
    this.analyser.getByteFrequencyData(dataArray)
    return dataArray
  }

  getBands(): { bass: number; mid: number; treble: number } {
    const data = this.getFrequencyData()
    const length = data.length
    
    // Split frequency spectrum into three bands
    const bassEnd = Math.floor(length * 0.1)
    const midEnd = Math.floor(length * 0.4)
    
    const bass = data.slice(0, bassEnd).reduce((sum, val) => sum + val, 0) / bassEnd
    const mid = data.slice(bassEnd, midEnd).reduce((sum, val) => sum + val, 0) / (midEnd - bassEnd)
    const treble = data.slice(midEnd).reduce((sum, val) => sum + val, 0) / (length - midEnd)
    
    return { bass, mid, treble }
  }

  noteToFrequency(note: string): number {
    const noteMap: Record<string, number> = {
      'C': 261.63, 'C#': 277.18, 'Db': 277.18,
      'D': 293.66, 'D#': 311.13, 'Eb': 311.13,
      'E': 329.63, 'F': 349.23, 'F#': 369.99,
      'Gb': 369.99, 'G': 392.00, 'G#': 415.30,
      'Ab': 415.30, 'A': 440.00, 'A#': 466.16,
      'Bb': 466.16, 'B': 493.88
    }
    
    const octave = parseInt(note.slice(-1)) || 4
    const noteName = note.slice(0, -1) || 'A'
    const baseFreq = noteMap[noteName] || 440
    
    return baseFreq * Math.pow(2, octave - 4)
  }

  async playNote(note: AudioNote): Promise<void> {
    if (!this.audioContext || !this.analyser) return

    const frequency = this.noteToFrequency(note.note)
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime)
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(note.velocity, this.audioContext.currentTime + 0.1)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + note.duration)
    
    oscillator.connect(gainNode)
    gainNode.connect(this.analyser)
    
    oscillator.start(this.audioContext.currentTime + note.time)
    oscillator.stop(this.audioContext.currentTime + note.time + note.duration)
    
    // Cleanup
    oscillator.onended = () => {
      oscillator.disconnect()
      gainNode.disconnect()
    }
  }

  async playSequence(sequence: AudioSequence): Promise<void> {
    if (!this.audioContext) return

    const promises = sequence.notes.map(note => this.playNote(note))
    await Promise.all(promises)
  }

  generateRandomSequence(length: number = 8): AudioSequence {
    const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']
    const sequence: AudioNote[] = []
    
    for (let i = 0; i < length; i++) {
      sequence.push({
        note: notes[Math.floor(Math.random() * notes.length)],
        pitch: Math.random() * 12 + 60, // MIDI note range
        velocity: Math.random() * 0.8 + 0.2,
        time: i * 0.5, // 500ms between notes
        duration: 0.4
      })
    }
    
    return {
      notes: sequence,
      bpm: 120,
      timeSignature: [4, 4]
    }
  }

  createMelodyFromFrequency(frequency: number, duration: number = 2): AudioSequence {
    const baseNote = Math.round(12 * Math.log2(frequency / 440) + 69)
    const scale = [0, 2, 4, 5, 7, 9, 11] // Major scale intervals
    const sequence: AudioNote[] = []
    
    for (let i = 0; i < 8; i++) {
      const scaleNote = scale[Math.floor(Math.random() * scale.length)]
      const midiNote = baseNote + scaleNote
      const noteName = this.midiToNoteName(midiNote)
      
      sequence.push({
        note: noteName,
        pitch: midiNote,
        velocity: Math.random() * 0.6 + 0.4,
        time: i * (duration / 8),
        duration: duration / 10
      })
    }
    
    return {
      notes: sequence,
      bpm: 120,
      timeSignature: [4, 4]
    }
  }

  private midiToNoteName(midi: number): string {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const octave = Math.floor(midi / 12) - 1
    const note = noteNames[midi % 12]
    return `${note}${octave}`
  }

  dispose(): void {
    this.oscillators.forEach(osc => {
      osc.stop()
      osc.disconnect()
    })
    this.gainNodes.forEach(gain => gain.disconnect())
    this.oscillators.clear()
    this.gainNodes.clear()
    
    if (this.analyser) {
      this.analyser.disconnect()
    }
    
    if (this.audioContext) {
      this.audioContext.close()
    }
  }
}

export const secureAudioEngine = new SecureAudioEngine()
export default secureAudioEngine
