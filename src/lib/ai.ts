import * as mm from '@magenta/music';

let rnn: mm.MusicRNN | null = null;

async function ensureModel() {
  if (!rnn) {
    rnn = new mm.MusicRNN('https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/basic_rnn');
    await rnn.initialize();
  }
  return rnn;
}

export async function generateMelody(seed?: mm.INoteSequence, steps = 32) {
  const model = await ensureModel();
  const seq = seed || {
    ticksPerQuarter: 220,
    totalTime: 1,
    timeSignatures: [{ time: 0, numerator: 4, denominator: 4 }],
    tempos: [{ time: 0, qpm: 120 }],
    notes: [{ pitch: 60, startTime: 0, endTime: 0.5 }]
  } as mm.INoteSequence;
  const q = mm.sequences.quantizeNoteSequence(seq, 4);
  const result = await model.continueSequence(q, steps, 1.0);
  return result;
}
