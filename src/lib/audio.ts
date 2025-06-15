// src/lib/audio.ts
import * as Tone from 'tone'
import { useAudioSettings } from '../store/useAudioSettings'
import { useEffectSettings, defaultEffectParams, EffectParams } from '../store/useEffectSettings'
import { ObjectType } from '../store/useObjects'

// Synth instances (initialized once)
let noteSynth: Tone.Synth
let chordSynth: Tone.PolySynth
let beatSynth: Tone.MembraneSynth
let audioInitialized = false
let masterVolumeNode: Tone.Volume
const objectSynths = new Map<string, { type: ObjectType; synth: Tone.Synth | Tone.PolySynth | Tone.MembraneSynth; chain: EffectChain; meter: Tone.Meter }>()

interface EffectChain {
  hp: Tone.Filter
  lp: Tone.Filter
  delay: Tone.FeedbackDelay
  reverb: Tone.Reverb
}

/**
 * Initialize the audio engine on first user interaction.
 * Calls Tone.start(), then creates and configures synths.
 */
async function initAudioEngine() {
  if (audioInitialized) return
  await Tone.start()
  masterVolumeNode = new Tone.Volume(0).toDestination()
  masterVolumeNode.volume.value = Tone.gainToDb(useAudioSettings.getState().volume)
  // Single-note synth
  noteSynth = new Tone.Synth().connect(masterVolumeNode)
  noteSynth.oscillator.type = 'sine'
  noteSynth.envelope.attack = 0.05
  noteSynth.envelope.release = 1
  // Polyphonic chord synth
  chordSynth = new Tone.PolySynth(Tone.Synth).connect(masterVolumeNode)
  chordSynth.set({ oscillator: { type: 'triangle' } })
  chordSynth.set({ envelope: { attack: 0.1, release: 1.5 } })
  // Drum synth
  beatSynth = new Tone.MembraneSynth().connect(masterVolumeNode)
  beatSynth.pitchDecay = 0.05
  beatSynth.envelope.attack = 0.001
  beatSynth.envelope.decay = 0.3
  beatSynth.envelope.sustain = 0.1
  beatSynth.envelope.release = 1
  audioInitialized = true
}

function keyOffset(key: string): number {
  const map: Record<string, number> = { C: 0, 'C#': 1, D: 2, Eb: 3, E: 4, F: 5, 'F#': 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 }
  return map[key] ?? 0
}

function transpose(note: string, key: string) {
  return Tone.Frequency(note).transpose(keyOffset(key)).toNote()
}

function createChain(): EffectChain {
  const hp = new Tone.Filter(0, 'highpass')
  const lp = new Tone.Filter(20000, 'lowpass')
  const delay = new Tone.FeedbackDelay('8n', 0.5)
  const reverb = new Tone.Reverb(2)
  hp.connect(lp)
  lp.connect(delay)
  delay.connect(reverb)
  return { hp, lp, delay, reverb }
}

function getObjectSynth(id: string, type: ObjectType) {
  let os = objectSynths.get(id)
  if (!os) {
    const chain = createChain()
    let synth: Tone.Synth | Tone.PolySynth | Tone.MembraneSynth
    if (type === 'chord') synth = new Tone.PolySynth(Tone.Synth)
    else if (type === 'beat') synth = new Tone.MembraneSynth()
    else synth = new Tone.Synth()
    const meter = new Tone.Meter({ normalRange: true, smoothing: 0.8 })
    synth.connect(chain.hp)
    chain.reverb.connect(meter)
    meter.connect(masterVolumeNode)
    os = { type, synth, chain, meter }
    objectSynths.set(id, os)
  }
  return os
}

export function getObjectMeter(id: string): Tone.Meter | null {
  return objectSynths.get(id)?.meter ?? null
}

function applyParams(chain: EffectChain, params: EffectParams) {
  chain.reverb.wet.value = params.reverb
  chain.delay.wet.value = params.delay
  chain.lp.frequency.value = params.lowpass
  chain.hp.frequency.value = params.highpass
}

/**
 * Play a single note.
 * Ensures audio engine is initialized before scheduling.
 */
export async function playNote(id: string, note: string = 'C4') {
  await initAudioEngine()
  const { key } = useAudioSettings.getState()
  const finalNote = transpose(note, key)
  const os = getObjectSynth(id, 'note')
  const params = useEffectSettings.getState().getParams(id)
  applyParams(os.chain, params)
  ;(os.synth as Tone.Synth).triggerAttackRelease(finalNote, '8n', Tone.now() + 0.01)
}

/**
 * Play a triad chord.
 */
export async function playChord(id: string, notes: string[] = ['C4', 'E4', 'G4']) {
  await initAudioEngine()
  const { key } = useAudioSettings.getState()
  const final = notes.map((n) => transpose(n, key))
  const os = getObjectSynth(id, 'chord')
  const params = useEffectSettings.getState().getParams(id)
  applyParams(os.chain, params)
  ;(os.synth as Tone.PolySynth).triggerAttackRelease(final, '4n', Tone.now() + 0.01)
}

/**
 * Play a beat kick.
 */
export async function playBeat(id: string) {
  await initAudioEngine()
  const { key } = useAudioSettings.getState()
  const note = transpose('C2', key)
  const os = getObjectSynth(id, 'beat')
  const params = useEffectSettings.getState().getParams(id)
  applyParams(os.chain, params)
  ;(os.synth as Tone.MembraneSynth).triggerAttackRelease(note, '8n', Tone.now() + 0.01)
}

/**
 * Set global output volume (0 to 1)
 */
export async function setMasterVolume(vol: number) {
  await initAudioEngine()
  masterVolumeNode.volume.value = Tone.gainToDb(vol)
}

/**
 * Start a sustained note used for intro cues.
 */
export async function startNote(note: string = 'C4') {
  await initAudioEngine()
  const { key } = useAudioSettings.getState()
  const finalNote = transpose(note, key)
  noteSynth.triggerAttackRelease(finalNote, '1n', Tone.now())
}

/**
 * Stop the sustained note.
 */
export function stopNote() {
  if (noteSynth) {
    noteSynth.triggerRelease(Tone.now() + 0.01)
  }
}
