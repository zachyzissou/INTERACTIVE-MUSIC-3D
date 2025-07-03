import { create } from 'zustand'
import type { MagicMelody } from '../lib/ai'

interface MelodyState {
  melodies: Record<string, MagicMelody>
  setMelody: (id: string, melody: MagicMelody) => void
  getMelody: (id: string) => MagicMelody | null
}

export const useMelodies = create<MelodyState>((set, get) => ({
  melodies: {},
  setMelody: (id, melody) => set((s) => ({ melodies: { ...s.melodies, [id]: melody } })),
  getMelody: (id) => get().melodies[id] || null,
}))
