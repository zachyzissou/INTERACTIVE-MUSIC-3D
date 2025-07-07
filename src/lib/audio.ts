// src/lib/audio.ts
import type {
  Chorus,
  FeedbackDelay,
  Reverb,
  Distortion,
  BitCrusher,
  AutoFilter,
  ToneAudioNode,
  Synth,
  PolySynth,
  MembraneSynth,
  Meter,
  Volume,
  Filter,
  Loop,
} from 'tone'
import { useAudioSettings } from '../store/useAudioSettings'
import { useEffectSettings, EffectParams } from '../store/useEffectSettings'
import { ObjectType } from '../store/useObjects'
import { useLoops } from '../store/useLoops'
import { logger } from './logger'
import { audioNodePool } from './audioNodePool'
import { presetConfigs } from './enhancedAudio'

import { beatBus } from "./events"
import {
  NOTE_ATTACK,
  NOTE_RELEASE,
  CHORD_ATTACK,
  CHORD_RELEASE,
  BEAT_PITCH_DECAY,
  BEAT_ATTACK,
  BEAT_DECAY,
  BEAT_SUSTAIN,
  BEAT_RELEASE,
} from '../config/constants'

let Tone: typeof import('tone') | null = null

// Type aliases
type AudioSynth = Synth | PolySynth | MembraneSynth

async function ensureTone() {
  if (Tone) return Tone
  
  try {
    Tone = await import('tone')
    return Tone
  } catch (error) {
    console.error('Failed to load Tone.js:', error)
    // Create a minimal no-op fallback to prevent crashes
    Tone = {
      start: () => Promise.resolve(),
      getContext: () => ({ resume: () => Promise.resolve(), state: 'running' }),
      Gain: class { 
        constructor() {} 
        connect() { return this } 
        toDestination() { return this } 
        volume = { value: 0 } 
      },
      Volume: class { 
        constructor() {} 
        connect() { return this } 
        toDestination() { return this } 
        volume = { value: 0 } 
      },
      Synth: class { 
        constructor() {} 
        connect() { return this } 
        toDestination() { return this } 
        oscillator = { type: 'sine' } 
        envelope = { attack: 0.1, release: 0.1 } 
        triggerAttackRelease() {}
      },
      PolySynth: class { 
        constructor() {} 
        connect() { return this } 
        toDestination() { return this } 
        set() {}
        triggerAttackRelease() {}
      },
      MembraneSynth: class { 
        constructor() {} 
        connect() { return this } 
        toDestination() { return this } 
        envelope = { attack: 0.1, decay: 0.1, sustain: 0.5, release: 0.1 } 
        pitchDecay = 0.05
        triggerAttackRelease() {}
      },
      Chorus: class { 
        constructor() {} 
        connect() { return this } 
        toDestination() { return this } 
        depth = 0 
      },
      FeedbackDelay: class { 
        constructor() {} 
        connect() { return this } 
        toDestination() { return this } 
        feedback = { value: 0.5 } 
      },
      Reverb: class { 
        constructor() {} 
        connect() { return this } 
        toDestination() { return this } 
        wet = { value: 0.3 } 
      },
      AutoFilter: class { 
        constructor() {} 
        connect() { return this } 
        toDestination() { return this } 
      },
      Distortion: class { 
        constructor() {} 
        connect() { return this } 
        toDestination() { return this } 
      },
      BitCrusher: class { 
        constructor() {} 
        connect() { return this } 
        toDestination() { return this } 
        wet = { value: 0.3 } 
        set() {}
      },
      Filter: class { 
        constructor() {} 
        connect() { return this } 
        toDestination() { return this } 
        frequency = { value: 440 } 
      },
      now: () => 0,
      Frequency: (note: string) => ({ transpose: () => ({ toNote: () => note }) })
    } as any
    return Tone
  }
}

export function getTone() {
  return Tone
}
// Synth instances (initialized once)
let noteSynth: Synth
let chordSynth: PolySynth
let beatSynth: MembraneSynth
// Flag indicating if synthesis nodes have been created yet.
// This stays false until a user gesture triggers Tone.start().
let audioInitialized = false
let initPromise: Promise<void> | null = null
let allowInit = false
const audioEvents = new EventTarget()

export function isAudioInitialized() {
  return audioInitialized
}

export function onAudioInit(cb: () => void) {
  audioEvents.addEventListener('init', cb)
  return () => audioEvents.removeEventListener('init', cb)
}

export function enableAudioInit() {
  allowInit = true
}

/**
 * Resume the AudioContext after a user gesture.
 */
export async function startAudioContext() {
  enableAudioInit()
  await initAudioEngine()
  if (process.env.NODE_ENV !== 'production') {
    logger.debug('Audio context started')
  }
}
let masterVolumeNode: Volume

let chorus: Chorus
let delay: FeedbackDelay
let reverb: Reverb
let filter: AutoFilter
let distortion: Distortion
let bitcrusher: BitCrusher
let masterChain: ToneAudioNode

export function getMasterChain(): ToneAudioNode {
  return masterChain
}

async function initEffects() {
  if (chorus) return
  const Tone = await ensureTone()
  
  try {
    // Ensure Tone.js context is ready before creating effects
    await Tone!.start()
    await Tone!.getContext().resume()
    
    // Create effects with careful parameter checking for WebKit compatibility
    chorus = new Tone!.Chorus()
    delay = new Tone!.FeedbackDelay()
    reverb = new Tone!.Reverb()
    filter = new Tone!.AutoFilter()
    distortion = new Tone!.Distortion()
    bitcrusher = new Tone!.BitCrusher(4)
    
    // Safe parameter assignment with WebKit compatibility
    try {
      if (bitcrusher.wet?.value !== undefined) {
        bitcrusher.wet.value = 0.3
      }
    } catch (error) {
      console.warn('BitCrusher wet parameter error (WebKit compatibility):', error)
    }
    
    // Chain effects together
    bitcrusher.connect(distortion)
    distortion.connect(filter)
    filter.connect(reverb)
    reverb.connect(delay)
    delay.connect(chorus)
    chorus.toDestination()
    
    masterChain = bitcrusher
    if (typeof window !== 'undefined') {
      ;(window as any).__toneNodes__ = { chorus, delay, reverb, bitcrusher }
    }
  } catch (error) {
    console.error('Failed to initialize audio effects:', error)
    // Fallback: create a simple passthrough chain with proper destination
    try {
      masterChain = new Tone!.Gain(1)
      masterChain.toDestination()
    } catch (fallbackError) {
      console.error('Fallback audio chain also failed:', fallbackError)
      // Last resort: use a dummy object that safely ignores calls
      masterChain = {
        connect: () => masterChain,
        toDestination: () => masterChain,
        disconnect: () => {},
        dispose: () => {}
      } as any
    }
  }
}
interface ObjectAudio {
  type: ObjectType
  synth: AudioSynth
  chain: EffectChain
  meter: Meter
  panner: PannerNode
}
const objectSynths = new Map<string, ObjectAudio>()

interface EffectChain {
  hp: Filter
  lp: Filter
  delay: FeedbackDelay
  reverb: Reverb
}

/**
 * Initialize the audio engine on first user interaction.
 * Calls Tone.start(), then creates and configures synths.
 */
export async function initAudioEngine() {
  if (audioInitialized || !allowInit) return
  if (initPromise) return initPromise
  
  // Detect WebKit and skip audio initialization to prevent crashes
  const isWebKit = typeof window !== 'undefined' && 
    /WebKit/i.test(navigator.userAgent) && 
    !/Chrome/i.test(navigator.userAgent)
  
  if (isWebKit) {
    console.warn('WebKit detected - skipping audio initialization due to compatibility issues')
    audioInitialized = true
    audioEvents.dispatchEvent(new Event('init'))
    return
  }
  
  initPromise = (async () => {
    const Tone = await ensureTone()
    if (audioInitialized) { initPromise = null; return }
    
    try {
      await Tone!.start()
      await Tone!.getContext().resume()
      await initEffects()
      
      // Only proceed if effects were successfully initialized
      if (!masterChain) {
        throw new Error('Failed to initialize audio effects chain')
      }
      
      masterVolumeNode = new Tone!.Volume({ volume: 0 }).connect(masterChain)
      
      // Safe volume setting
      try {
        if (masterVolumeNode.volume?.value !== undefined) {
          masterVolumeNode.volume.value = useAudioSettings.getState().volume * 100 - 100
        }
      } catch (volumeError) {
        console.warn('Volume initialization error (WebKit compatibility):', volumeError)
      }
      
      // Single-note synth
      noteSynth = new Tone!.Synth().connect(masterVolumeNode)
      noteSynth.oscillator.type = 'sine'
      noteSynth.envelope.attack = NOTE_ATTACK
      noteSynth.envelope.release = NOTE_RELEASE
      
      // Polyphonic chord synth
      chordSynth = new Tone!.PolySynth({ voice: Tone!.Synth }).connect(masterVolumeNode)
      chordSynth.set({ oscillator: { type: 'triangle' } })
      chordSynth.set({ envelope: { attack: CHORD_ATTACK, release: CHORD_RELEASE } })
      
      // Drum synth
      beatSynth = new Tone!.MembraneSynth().connect(masterVolumeNode)
      beatSynth.pitchDecay = BEAT_PITCH_DECAY
      beatSynth.envelope.attack = BEAT_ATTACK
      beatSynth.envelope.decay = BEAT_DECAY
      beatSynth.envelope.sustain = BEAT_SUSTAIN
      beatSynth.envelope.release = BEAT_RELEASE
      
      audioInitialized = true
      initPromise = null
      audioEvents.dispatchEvent(new Event('init'))
    } catch (error) {
      console.error('Audio engine initialization failed:', error)
      // Set up minimal fallback state
      initPromise = null
      // Don't set audioInitialized = true to allow retry
    }
  })()
  return initPromise
}

function keyOffset(key: string): number {
  const map: Record<string, number> = { C: 0, 'C#': 1, D: 2, Eb: 3, E: 4, F: 5, 'F#': 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 }
  return map[key] ?? 0
}

function transpose(note: string, key: string) {
  const Tone = getTone()
  return Tone ? Tone.Frequency(note).transpose(keyOffset(key)).toNote() : note
}

function createChain(): EffectChain {
  const Tone = getTone()!
  const hp = new Tone.Filter({ frequency: 0, type: 'highpass' })
  const lp = new Tone.Filter({ frequency: 20000, type: 'lowpass' })
  const delay = new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.5 })
  const reverb = new Tone.Reverb({ decay: 2 })
  hp.connect(lp)
  lp.connect(delay)
  delay.connect(reverb)
  return { hp, lp, delay, reverb }
}

async function getObjectSynth(id: string, type: ObjectType) {
  const Tone = getTone()
  if (!Tone) {
    // Return a dummy object synth for WebKit compatibility
    return {
      type,
      synth: { triggerAttackRelease: () => {}, connect: () => {}, disconnect: () => {} },
      chain: {
        hp: { connect: () => {} },
        lp: { connect: () => {} },
        delay: { connect: () => {} },
        reverb: { connect: () => {} }
      },
      meter: { connect: () => {} },
      panner: {}
    } as any
  }
  
  let os = objectSynths.get(id)
  if (!os) {
    const chain = createChain()
    const { synthPreset } = useAudioSettings.getState()
    const synth = await getPooledSynth(type, synthPreset)
    const meter = new Tone.Meter({ normalRange: true, smoothing: 0.8 })
    const ctx = Tone.getContext().rawContext
    const panner = ctx.createPanner()
    panner.panningModel = 'HRTF'
    panner.distanceModel = 'inverse'
    panner.refDistance = 1
    panner.maxDistance = 50
    panner.rolloffFactor = 1
    synth.connect(chain.hp)
    chain.reverb.connect(panner)
    Tone.connect(panner, meter)
    meter.connect(masterVolumeNode)
    os = { type, synth, chain, meter, panner }
    objectSynths.set(id, os)
  }
  return os
}

// Meters and panners are created on demand after audio init.
export function getObjectMeter(id: string): Meter | null {
  if (!audioInitialized) return null
  return objectSynths.get(id)?.meter ?? null
}

export function getObjectPanner(id: string): PannerNode | null {
  if (!audioInitialized) return null
  return objectSynths.get(id)?.panner ?? null
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
  if (!audioInitialized || !noteSynth) return
  const { key } = useAudioSettings.getState()
  const finalNote = transpose(note, key)
  const os = await getObjectSynth(id, 'note')
  const params = useEffectSettings.getState().getParams(id)
  applyParams(os.chain, params)
  const Tone = getTone()
  if (!Tone) return
  ;(os.synth as Synth).triggerAttackRelease(finalNote, '8n', Tone.now() + 0.01)
}

/**
 * Play a triad chord.
 */
export async function playChord(id: string, notes: string[] = ['C4', 'E4', 'G4']) {
  await initAudioEngine()
  if (!audioInitialized || !chordSynth) return
  const { key } = useAudioSettings.getState()
  const final = notes.map((n) => transpose(n, key))
  const os = await getObjectSynth(id, 'chord')
  const params = useEffectSettings.getState().getParams(id)
  applyParams(os.chain, params)
  const Tone = getTone()
  if (!Tone) return
  ;(os.synth as PolySynth).triggerAttackRelease(final, '4n', Tone.now() + 0.01)
}

/**
 * Play a beat kick.
 */
export async function playBeat(id: string) {
  beatBus.dispatchEvent(new Event("beat"));
  await initAudioEngine()
  if (!audioInitialized || !beatSynth) return
  const { key } = useAudioSettings.getState()
  const note = transpose('C2', key)
  const os = await getObjectSynth(id, 'beat')
  const params = useEffectSettings.getState().getParams(id)
  applyParams(os.chain, params)
  const Tone = getTone()
  if (!Tone) return
  ;(os.synth as MembraneSynth).triggerAttackRelease(note, '8n', Tone.now() + 0.01)
}

/**
 * Set global output volume (0 to 1)
 */
export async function setMasterVolume(vol: number) {
  await initAudioEngine()
  if (!audioInitialized) return
  // Map slider 0-1 to -100dB to 0dB for a perceptual volume curve
  try {
    if (masterVolumeNode.volume?.value !== undefined) {
      masterVolumeNode.volume.value = vol * 100 - 100
    }
  } catch (error) {
    console.warn('Master volume parameter error (WebKit compatibility):', error)
  }
}

export async function setChorusDepth(v: number) {
  await initEffects()
  chorus.depth = v
}
export async function setReverbWet(v: number) {
  await initEffects()
  try {
    if (reverb?.wet?.value !== undefined) {
      reverb.wet.value = v
    }
  } catch (error) {
    console.warn('Reverb wet parameter error (WebKit compatibility):', error)
  }
}
export async function setDelayFeedback(v: number) {
  await initEffects()
  try {
    if (delay?.feedback?.value !== undefined) {
      delay.feedback.value = v
    }
  } catch (error) {
    console.warn('Delay feedback parameter error (WebKit compatibility):', error)
  }
}
export async function setBitcrusherBits(v: number) {
  await initEffects()
  bitcrusher.set({ bits: v })
}
export async function setFilterFrequency(v: number) {
  await initEffects()
  filter.baseFrequency = v
}

/**
 * Start a sustained note used for intro cues.
 */
export async function startNote(note: string = 'C4') {
  await initAudioEngine()
  if (!audioInitialized) return
  const { key } = useAudioSettings.getState()
  const finalNote = transpose(note, key)
  const Tone = getTone()!
  noteSynth.triggerAttackRelease(finalNote, '1n', Tone.now())
}

/**
 * Stop the sustained note.
 */
export function stopNote() {
  if (noteSynth) {
    const Tone = getTone()!
    noteSynth.triggerRelease(Tone.now() + 0.01)
  }
}

interface LoopInfo {
  loop: Loop
  start: number
  duration: number
}

const loops = new Map<string, LoopInfo>()

export function getLoopProgress(id: string): number {
  const info = loops.get(id)
  if (!info) return 0
  const Tone = getTone()!
  const transport = Tone.getTransport()
  const now = transport.seconds
  const elapsed = (now - info.start) % info.duration
  return elapsed / info.duration
}

export async function startLoop(id: string, interval: string = '1m') {
  await initAudioEngine()
  if (!audioInitialized) return
  if (loops.has(id)) return
  const bpm = useAudioSettings.getState().bpm
  const Tone = getTone()!
  const transport = Tone.getTransport()
  transport.bpm.value = bpm
  const dur = Tone.Time(interval).toSeconds()
  const start = transport.seconds
  const loop = new Tone.Loop(() => {
    playBeat(id)
  }, interval).start(0)
  loops.set(id, { loop, start, duration: dur })
  if (transport.state !== 'started') transport.start()
  useLoops.getState().start(id)
}

export function stopLoop(id: string) {
  const info = loops.get(id)
  if (info) {
    info.loop.stop()
    info.loop.dispose()
    loops.delete(id)
  }
  useLoops.getState().stop(id)
}

let spawnSynth: Synth | null = null
export async function playSpawnSound() {
  await initAudioEngine()
  if (!audioInitialized) return
  const Tone = getTone()!
  spawnSynth ??= new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.3 }
  }).connect(masterVolumeNode)
  spawnSynth.triggerAttackRelease('C6', '16n', Tone.now())
}

// Audio node pool integration
async function getPooledSynth(type: ObjectType, preset?: keyof typeof presetConfigs): Promise<AudioSynth> {
  const Tone = getTone()
  if (!Tone) {
    // Return a dummy synth for WebKit compatibility
    return {
      triggerAttackRelease: () => {},
      connect: () => {},
      disconnect: () => {},
      dispose: () => {}
    } as any
  }
  
  return audioNodePool.acquire('synth', () => {
    if (type === 'chord') {
      const config = preset ? presetConfigs[preset] : presetConfigs.pad
      // For chords, create a PolySynth with enhanced voice
      return new Tone.PolySynth({ 
        voice: class extends Tone.Synth {
          constructor() {
            super()
            // Apply enhanced config to this synth
            this.oscillator.type = config.waveform
            this.envelope.attack = config.attack
            this.envelope.decay = config.decay
            this.envelope.sustain = config.sustain
            this.envelope.release = config.release
          }
        }
      })
    } else if (type === 'beat') {
      return new Tone.MembraneSynth()
    } else {
      const config = preset ? presetConfigs[preset] : presetConfigs.lead
      const synth = new Tone.Synth()
      synth.oscillator.type = config.waveform
      synth.envelope.attack = config.attack
      synth.envelope.decay = config.decay
      synth.envelope.sustain = config.sustain
      synth.envelope.release = config.release
      return synth
    }
  })
}

function returnSynthToPool(synth: AudioSynth) {
  try {
    // Stop all notes and reset
    if ('releaseAll' in synth) {
      synth.releaseAll()
    } else if ('triggerRelease' in synth) {
      synth.triggerRelease()
    }
    
    // Return to pool
    audioNodePool.release('synth', synth)
  } catch (error) {
    logger.error('Failed to return synth to pool: ' + String(error))
  }
}
