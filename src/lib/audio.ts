// src/lib/audio.ts
import * as Tone from 'tone'

// Synth instances (initialized once)
let noteSynth: Tone.Synth
let chordSynth: Tone.PolySynth
let beatSynth: Tone.MembraneSynth
let audioInitialized = false
let masterVolume: Tone.Volume

/**
 * Initialize the audio engine on first user interaction.
 * Calls Tone.start(), then creates and configures synths.
 */
async function initAudioEngine() {
  if (audioInitialized) return
  await Tone.start()
  masterVolume = new Tone.Volume(0).toDestination()
  // Single-note synth
  noteSynth = new Tone.Synth().connect(masterVolume)
  noteSynth.oscillator.type = 'sine'
  noteSynth.envelope.attack = 0.05
  noteSynth.envelope.release = 1
  // Polyphonic chord synth
  chordSynth = new Tone.PolySynth(Tone.Synth).connect(masterVolume)
  chordSynth.set({ oscillator: { type: 'triangle' } })
  chordSynth.set({ envelope: { attack: 0.1, release: 1.5 } })
  // Drum synth
  beatSynth = new Tone.MembraneSynth().connect(masterVolume)
  beatSynth.pitchDecay = 0.05
  beatSynth.envelope.attack = 0.001
  beatSynth.envelope.decay = 0.3
  beatSynth.envelope.sustain = 0.1
  beatSynth.envelope.release = 1
  audioInitialized = true
}

/**
 * Play a single note.
 * Ensures audio engine is initialized before scheduling.
 */
export async function playNote(note: string = 'C4') {
  await initAudioEngine()
  noteSynth.triggerAttackRelease(note, '8n', Tone.now() + 0.01)
}

/**
 * Play a triad chord.
 */
export async function playChord(notes: string[] = ['C4', 'E4', 'G4']) {
  await initAudioEngine()
  chordSynth.triggerAttackRelease(notes, '4n', Tone.now() + 0.01)
}

/**
 * Play a beat kick.
 */
export async function playBeat() {
  await initAudioEngine()
  beatSynth.triggerAttackRelease('C2', '8n', Tone.now() + 0.01)
}

/**
 * Set global output volume (0 to 1)
 */
export async function setMasterVolume(vol: number) {
  await initAudioEngine()
  masterVolume.volume.value = Tone.gainToDb(vol)
}

/**
 * Start a sustained note used for intro cues.
 */
export async function startNote(note: string = 'C4') {
  await initAudioEngine()
  noteSynth.triggerAttackRelease(note, '1n', Tone.now())
}

/**
 * Stop the sustained note.
 */
export function stopNote() {
  if (noteSynth) {
    noteSynth.triggerRelease(Tone.now() + 0.01)
  }
}
