// src/lib/enhancedAudio.ts
import { getTone } from './audio'
import { logger } from './logger'

export interface SynthConfig {
  waveform: 'sine' | 'triangle' | 'square' | 'sawtooth'
  attack: number
  decay: number
  sustain: number
  release: number
  filterFreq: number
  filterQ: number
  distortion: number
  chorus: number
  reverb: number
}

export const presetConfigs: Record<string, SynthConfig> = {
  lead: {
    waveform: 'sawtooth',
    attack: 0.01,
    decay: 0.2,
    sustain: 0.7,
    release: 0.5,
    filterFreq: 2000,
    filterQ: 5,
    distortion: 0.3,
    chorus: 0.2,
    reverb: 0.4
  },
  pad: {
    waveform: 'triangle',
    attack: 0.8,
    decay: 0.3,
    sustain: 0.8,
    release: 2.0,
    filterFreq: 800,
    filterQ: 2,
    distortion: 0.1,
    chorus: 0.6,
    reverb: 0.8
  },
  bass: {
    waveform: 'square',
    attack: 0.05,
    decay: 0.1,
    sustain: 0.3,
    release: 0.8,
    filterFreq: 400,
    filterQ: 8,
    distortion: 0.5,
    chorus: 0.1,
    reverb: 0.2
  },
  pluck: {
    waveform: 'triangle',
    attack: 0.001,
    decay: 0.3,
    sustain: 0.1,
    release: 0.4,
    filterFreq: 3000,
    filterQ: 3,
    distortion: 0.2,
    chorus: 0.3,
    reverb: 0.5
  }
}

export class EnhancedSynth {
  private synth: any
  private filter: any
  private chorus: any
  private reverb: any
  private distortion: any
  private config: SynthConfig

  constructor(config: SynthConfig) {
    this.config = config
    this.initSynth()
  }

  private async initSynth() {
    const Tone = getTone()
    if (!Tone) return

    // Create enhanced synth with multiple oscillators
    this.synth = new Tone.Synth({
      oscillator: {
        type: this.config.waveform as any // Use basic waveform types
      },
      envelope: {
        attack: this.config.attack,
        decay: this.config.decay,
        sustain: this.config.sustain,
        release: this.config.release
      }
    })

    // Add filter for character
    this.filter = new Tone.Filter({
      frequency: this.config.filterFreq,
      Q: this.config.filterQ,
      type: 'lowpass'
    })

    // Add chorus for width
    this.chorus = new Tone.Chorus({
      frequency: 1.5,
      delayTime: 3.5,
      depth: this.config.chorus
    })

    // Add reverb for space
    this.reverb = new Tone.Reverb({
      decay: 3,
      wet: this.config.reverb
    })

    // Add distortion for character
    this.distortion = new Tone.Distortion({
      distortion: this.config.distortion,
      wet: 0.3
    })

    // Chain effects
    this.synth.chain(this.filter, this.distortion, this.chorus, this.reverb, Tone.Destination)
    
    logger.info('Enhanced synth initialized')
  }

  play(note: string, duration: string = '8n') {
    if (!this.synth) return
    
    const Tone = getTone()
    if (!Tone) return

    // Add subtle pitch bend for expressiveness
    const freq = Tone.Frequency(note).toFrequency()
    this.synth.frequency.setValueAtTime(freq * 1.02, Tone.now())
    this.synth.frequency.exponentialRampToValueAtTime(freq, Tone.now() + 0.05)
    
    this.synth.triggerAttackRelease(note, duration)
  }

  updateConfig(newConfig: Partial<SynthConfig>) {
    this.config = { ...this.config, ...newConfig }
    
    if (this.synth) {
      this.synth.oscillator.type = this.config.waveform
      this.synth.envelope.attack = this.config.attack
      this.synth.envelope.decay = this.config.decay
      this.synth.envelope.sustain = this.config.sustain
      this.synth.envelope.release = this.config.release
    }
    
    if (this.filter) {
      this.filter.frequency.value = this.config.filterFreq
      this.filter.Q.value = this.config.filterQ
    }
    
    if (this.chorus) {
      this.chorus.depth = this.config.chorus
    }
    
    if (this.reverb) {
      this.reverb.wet.value = this.config.reverb
    }
    
    if (this.distortion) {
      this.distortion.distortion = this.config.distortion
    }
  }

  dispose() {
    this.synth?.dispose()
    this.filter?.dispose()
    this.chorus?.dispose()
    this.reverb?.dispose()
    this.distortion?.dispose()
  }
}

// Scale definitions for musical generation
export const scales = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 2, 4, 7, 9],
  blues: [0, 3, 5, 6, 7, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11]
}

export function generateMelody(scale: number[], rootNote: string = 'C4', length: number = 8): string[] {
  const Tone = getTone()
  if (!Tone) return []

  const melody: string[] = []
  const baseFreq = Tone.Frequency(rootNote).toMidi()
  
  for (let i = 0; i < length; i++) {
    const scaleIndex = Math.floor(Math.random() * scale.length)
    const octaveShift = Math.floor(Math.random() * 3) - 1 // -1, 0, or 1 octave
    const midiNote = baseFreq + scale[scaleIndex] + (octaveShift * 12)
    melody.push(Tone.Frequency(midiNote, 'midi').toNote())
  }
  
  return melody
}

export function generateChord(scale: number[], rootNote: string = 'C4', chordType: 'triad' | 'seventh' = 'triad'): string[] {
  const Tone = getTone()
  if (!Tone) return []

  const baseFreq = Tone.Frequency(rootNote).toMidi()
  const chord: string[] = []
  
  // Build chord from scale degrees
  const intervals = chordType === 'triad' ? [0, 2, 4] : [0, 2, 4, 6]
  
  intervals.forEach(interval => {
    const scaleIndex = interval % scale.length
    const octaveShift = Math.floor(interval / scale.length)
    const midiNote = baseFreq + scale[scaleIndex] + (octaveShift * 12)
    chord.push(Tone.Frequency(midiNote, 'midi').toNote())
  })
  
  return chord
}
