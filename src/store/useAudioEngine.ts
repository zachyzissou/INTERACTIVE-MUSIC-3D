import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

/**
 * Audio engine state store with modern Zustand patterns.
 * Manages global audio system state and initialization.
 */

export interface AudioEngineState {
  // Audio system state (primitives only)
  audioReady: boolean
  audioContext: 'suspended' | 'running' | 'closed' | 'unknown'
  isInitializing: boolean
  hasUserInteracted: boolean
  
  // Error tracking
  lastError: string | null
  initAttempts: number
  maxInitAttempts: number
  
  // Performance tracking
  latency: number        // Audio latency in ms
  sampleRate: number     // Audio sample rate
  bufferSize: number     // Audio buffer size
  
  // Actions
  setAudioReady: (ready: boolean) => void
  setAudioContext: (state: 'suspended' | 'running' | 'closed' | 'unknown') => void
  setIsInitializing: (initializing: boolean) => void
  setUserInteracted: (interacted: boolean) => void
  setError: (error: string | null) => void
  incrementInitAttempts: () => void
  resetInitAttempts: () => void
  setPerformanceMetrics: (latency: number, sampleRate: number, bufferSize: number) => void
  
  // Utilities
  canInitializeAudio: () => boolean
  shouldRetryInit: () => boolean
}

export const useAudioEngine = create<AudioEngineState>()(
  subscribeWithSelector((set, get) => ({
    // Default state
    audioReady: false,
    audioContext: 'unknown',
    isInitializing: false,
    hasUserInteracted: false,
    lastError: null,
    initAttempts: 0,
    maxInitAttempts: 3,
    latency: 0,
    sampleRate: 44100,
    bufferSize: 256,

    setAudioReady: (ready: boolean) => {
      set({ audioReady: ready })
      
      // Clear error when audio becomes ready
      if (ready) {
        set({ lastError: null })
      }
    },

    setAudioContext: (audioContext: 'suspended' | 'running' | 'closed' | 'unknown') => {
      set({ audioContext })
      
      // Update audioReady based on context state
      const ready = audioContext === 'running'
      if (get().audioReady !== ready) {
        set({ audioReady: ready })
      }
    },

    setIsInitializing: (isInitializing: boolean) => {
      set({ isInitializing })
    },

    setUserInteracted: (hasUserInteracted: boolean) => {
      set({ hasUserInteracted })
    },

    setError: (lastError: string | null) => {
      set({ lastError })
      
      // If there's an error, audio is not ready
      if (lastError && get().audioReady) {
        set({ audioReady: false })
      }
    },

    incrementInitAttempts: () => {
      const { initAttempts } = get()
      set({ initAttempts: initAttempts + 1 })
    },

    resetInitAttempts: () => {
      set({ initAttempts: 0 })
    },

    setPerformanceMetrics: (latency: number, sampleRate: number, bufferSize: number) => {
      // Validate and clamp values
      const clampedLatency = Math.max(0, Math.min(1000, latency))
      const clampedSampleRate = Math.max(8000, Math.min(192000, sampleRate))
      const clampedBufferSize = Math.max(64, Math.min(4096, bufferSize))
      
      set({ 
        latency: clampedLatency,
        sampleRate: clampedSampleRate,
        bufferSize: clampedBufferSize
      })
    },

    canInitializeAudio: () => {
      const { hasUserInteracted, isInitializing, audioReady } = get()
      return hasUserInteracted && !isInitializing && !audioReady
    },

    shouldRetryInit: () => {
      const { initAttempts, maxInitAttempts, audioReady } = get()
      return !audioReady && initAttempts < maxInitAttempts
    },
  }))
)
