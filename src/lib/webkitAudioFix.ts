// src/lib/webkitAudioFix.ts
// WebKit-specific audio compatibility fixes

export function isWebKit(): boolean {
  return typeof window !== 'undefined' && /WebKit/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent)
}

export function isSafari(): boolean {
  return typeof window !== 'undefined' && /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent)
}

/**
 * Create a minimal, WebKit-compatible audio context fallback
 */
export function createWebKitFallbackAudio() {
  const dummyAudioContext = {
    createGain: () => ({
      connect: () => dummyAudioContext,
      disconnect: () => {},
      gain: { value: 1 }
    }),
    createAnalyser: () => ({
      connect: () => dummyAudioContext,
      disconnect: () => {},
      fftSize: 256,
      frequencyBinCount: 128,
      getByteFrequencyData: () => {}
    }),
    destination: {},
    state: 'running',
    resume: () => Promise.resolve(),
    close: () => Promise.resolve()
  }

  const createDummyNode = () => ({
    connect: () => createDummyNode(),
    toDestination: () => createDummyNode(),
    disconnect: () => {},
    dispose: () => {}
  })

  return {
    Tone: {
      start: () => Promise.resolve(),
      getContext: () => dummyAudioContext,
      Gain: class {
        gain = { value: 1 }
        connect() { return this }
        toDestination() { return this }
        disconnect() {}
        dispose() {}
      },
      Volume: class {
        volume = { value: 0 }
        constructor(options: any = {}) {
          this.volume = { value: options.volume || 0 }
        }
        connect() { return this }
        toDestination() { return this }
        disconnect() {}
        dispose() {}
      },
      Synth: class {
        oscillator = { type: 'sine' }
        envelope = { attack: 0.1, release: 0.1 }
        connect() { return this }
        toDestination() { return this }
        triggerAttackRelease() {}
        dispose() {}
      },
      PolySynth: class {
        connect() { return this }
        toDestination() { return this }
        set() {}
        triggerAttackRelease() {}
        dispose() {}
      },
      MembraneSynth: class {
        envelope = { attack: 0.1, decay: 0.1, sustain: 0.5, release: 0.1 }
        pitchDecay = 0.05
        connect() { return this }
        toDestination() { return this }
        triggerAttackRelease() {}
        dispose() {}
      },
      Chorus: class {
        depth = 0
        connect() { return this }
        toDestination() { return this }
        dispose() {}
      },
      FeedbackDelay: class {
        feedback = { value: 0.5 }
        connect() { return this }
        toDestination() { return this }
        dispose() {}
      },
      Reverb: class {
        wet = { value: 0.3 }
        connect() { return this }
        toDestination() { return this }
        dispose() {}
      },
      AutoFilter: class {
        connect() { return this }
        toDestination() { return this }
        dispose() {}
      },
      Distortion: class {
        connect() { return this }
        toDestination() { return this }
        dispose() {}
      },
      BitCrusher: class {
        wet = { value: 0.3 }
        connect() { return this }
        toDestination() { return this }
        set() {}
        dispose() {}
      },
      Filter: class {
        frequency = { value: 440 }
        connect() { return this }
        toDestination() { return this }
        dispose() {}
      }
    }
  }
}
