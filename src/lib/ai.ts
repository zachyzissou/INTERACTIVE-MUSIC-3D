import type { INoteSequence } from '@magenta/music/esm/protobuf'
import { MusicRNN } from '@magenta/music/esm/music_rnn'
import * as sequences from '@magenta/music/esm/core/sequences'

export interface MagicMelody {
  notes: Array<{ time: number; note: number; duration: number; velocity: number }>
}

// Cached model instance
let rnn: MusicRNN | null = null

/**
 * Lazily load the MelodyRNN model. The checkpoint is served from /models/basic_rnn
 * inside the public folder so the app works completely offline.
 */
async function ensureModel() {
  if (!rnn) {
    rnn = new MusicRNN('/models/basic_rnn')
    await rnn.initialize()
  }
  return rnn
}

/**
 * Generate a short melody using Magenta's MelodyRNN model.
 * @param seed Optional starting sequence
 * @param steps Number of steps to generate
 */
export async function generateMelody(seed?: INoteSequence, steps = 32): Promise<MagicMelody> {
  try {
    const model = await ensureModel()
    const seq = seed || {
      ticksPerQuarter: 220,
      totalTime: 1,
      timeSignatures: [{ time: 0, numerator: 4, denominator: 4 }],
      tempos: [{ time: 0, qpm: 120 }],
      notes: [{ pitch: 60, startTime: 0, endTime: 0.5 }],
    } as INoteSequence
    const q = sequences.quantizeNoteSequence(seq, 4)
    const result = await model.continueSequence(q, steps, 1.0)
    const notes = result.notes?.map((n) => ({
      time: n.startTime ?? 0,
      note: n.pitch ?? 60,
      duration: (n.endTime ?? 0) - (n.startTime ?? 0),
      velocity: n.velocity ?? 80,
    })) || []
    return { notes }
  } catch (err) {
    console.error('MagicMelody generation failed', err)
    return { notes: [] }
  }
}
