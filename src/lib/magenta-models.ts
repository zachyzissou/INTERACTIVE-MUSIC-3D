// Magenta.js Model Management
import * as mm from '@magenta/music'

export interface ModelConfig {
  name: string
  checkpointUrl: string
  type: 'melody' | 'drums' | 'performance' | 'multi'
  description: string
}

export const AVAILABLE_MODELS: Record<string, ModelConfig> = {
  melodyRnn: {
    name: 'Melody RNN',
    checkpointUrl: 'https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/basic_rnn',
    type: 'melody',
    description: 'Basic melody generation model'
  },
  drumRnn: {
    name: 'Drum RNN',
    checkpointUrl: 'https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/drum_kit_rnn',
    type: 'drums',
    description: 'Drum pattern generation'
  },
  performanceRnn: {
    name: 'Performance RNN',
    checkpointUrl: 'https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/performance_rnn',
    type: 'performance',
    description: 'Expressive piano performance'
  },
  musicVae: {
    name: 'Music VAE',
    checkpointUrl: 'https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/mel_2bar_small',
    type: 'melody',
    description: 'Variational autoencoder for interpolation'
  },
  multitrack: {
    name: 'Multitrack VAE',
    checkpointUrl: 'https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/multitrack_med',
    type: 'multi',
    description: 'Multi-instrument generation'
  }
}

class MagentaModelManager {
  private models: Map<string, any> = new Map()
  private loadingPromises: Map<string, Promise<any>> = new Map()

  async loadModel(modelKey: string): Promise<any> {
    // Return cached model if available
    if (this.models.has(modelKey)) {
      return this.models.get(modelKey)
    }

    // Return existing loading promise if in progress
    if (this.loadingPromises.has(modelKey)) {
      return this.loadingPromises.get(modelKey)
    }

    const config = AVAILABLE_MODELS[modelKey]
    if (!config) {
      throw new Error(`Unknown model: ${modelKey}`)
    }

    // Start loading
    const loadingPromise = this.loadModelInternal(modelKey, config)
    this.loadingPromises.set(modelKey, loadingPromise)

    try {
      const model = await loadingPromise
      this.models.set(modelKey, model)
      this.loadingPromises.delete(modelKey)
      return model
    } catch (error) {
      this.loadingPromises.delete(modelKey)
      throw error
    }
  }

  private async loadModelInternal(modelKey: string, config: ModelConfig): Promise<any> {
    console.log(`Loading Magenta model: ${config.name}...`)

    let model: any

    switch (modelKey) {
      case 'melodyRnn':
      case 'drumRnn':
      case 'performanceRnn':
        model = new mm.MusicRNN(config.checkpointUrl)
        break
      case 'musicVae':
      case 'multitrack':
        model = new mm.MusicVAE(config.checkpointUrl)
        break
      default:
        throw new Error(`Unsupported model type: ${modelKey}`)
    }

    await model.initialize()
    console.log(`✅ Loaded ${config.name}`)
    return model
  }

  async generateMelody(
    seedNotes: mm.NoteSequence,
    steps: number = 32,
    temperature: number = 1.0,
    modelKey: string = 'melodyRnn'
  ): Promise<mm.NoteSequence> {
    const model = await this.loadModel(modelKey)
    
    if (!(model instanceof mm.MusicRNN)) {
      throw new Error('Selected model is not suitable for melody generation')
    }

    const result = await model.continueSequence(seedNotes, steps, temperature)
    return result
  }

  async generateDrums(
    seedPattern?: mm.NoteSequence,
    bars: number = 2,
    temperature: number = 1.0
  ): Promise<mm.NoteSequence> {
    const model = await this.loadModel('drumRnn')
    
    if (seedPattern) {
      return model.continueSequence(seedPattern, bars * 16, temperature)
    } else {
      // Generate from scratch
      const primer = this.createDrumPrimer()
      return model.continueSequence(primer, bars * 16 - primer.notes.length, temperature)
    }
  }

  async interpolate(
    sequence1: mm.NoteSequence,
    sequence2: mm.NoteSequence,
    numInterpolations: number = 4
  ): Promise<mm.NoteSequence[]> {
    const model = await this.loadModel('musicVae')
    
    if (!(model instanceof mm.MusicVAE)) {
      throw new Error('Interpolation requires Music VAE model')
    }

    const z1 = await model.encode([sequence1])
    const z2 = await model.encode([sequence2])
    
    const interpolations: any[] = []
    for (let i = 0; i <= numInterpolations; i++) {
      const t = i / numInterpolations
      const zInterp = z1.map((val: number, idx: number) => 
        val * (1 - t) + z2[idx] * t
      )
      interpolations.push(zInterp)
    }

    return model.decode(interpolations)
  }

  private createDrumPrimer(): mm.NoteSequence {
    // Basic kick-snare pattern
    return {
      notes: [
        { pitch: 36, startTime: 0, endTime: 0.5, velocity: 80 }, // Kick
        { pitch: 38, startTime: 0.5, endTime: 1, velocity: 80 }, // Snare
        { pitch: 36, startTime: 1, endTime: 1.5, velocity: 80 }, // Kick
        { pitch: 38, startTime: 1.5, endTime: 2, velocity: 80 }, // Snare
      ],
      totalTime: 2,
      ticksPerQuarter: 220,
      timeSignatures: [{ time: 0, numerator: 4, denominator: 4 }],
      tempos: [{ time: 0, qpm: 120 }]
    }
  }

  async generateMultitrack(
    bars: number = 4,
    temperature: number = 1.0
  ): Promise<mm.NoteSequence> {
    const model = await this.loadModel('multitrack')
    
    // Generate random latent vector
    const z = Array.from({ length: model.decoder.zDims }, () => 
      (Math.random() - 0.5) * 2 * temperature
    )
    
    const sequences = await model.decode([z], temperature)
    return sequences[0]
  }

  disposeModel(modelKey: string): void {
    const model = this.models.get(modelKey)
    if (model && typeof model.dispose === 'function') {
      model.dispose()
    }
    this.models.delete(modelKey)
  }

  disposeAll(): void {
    for (const [key, model] of this.models) {
      if (typeof model.dispose === 'function') {
        model.dispose()
      }
    }
    this.models.clear()
    this.loadingPromises.clear()
  }
}

// Singleton instance
export const magentaModels = new MagentaModelManager()

// Helper function to convert Tone.js notes to Magenta format
export function toneToMagentaNote(
  toneNote: string,
  startTime: number,
  duration: number,
  velocity: number = 80
): mm.Note {
  const midi = mm.NoteSequence.KeyToMidiPitch(toneNote)
  return {
    pitch: midi,
    startTime,
    endTime: startTime + duration,
    velocity
  }
}

// Convert Magenta sequence to Tone.js format
export function magentaToToneNotes(sequence: mm.NoteSequence): Array<{
  note: string
  time: number
  duration: number
  velocity: number
}> {
  return sequence.notes.map(note => ({
    note: mm.NoteSequence.MidiPitchToKey(note.pitch),
    time: note.startTime,
    duration: note.endTime - note.startTime,
    velocity: note.velocity / 127
  }))
}