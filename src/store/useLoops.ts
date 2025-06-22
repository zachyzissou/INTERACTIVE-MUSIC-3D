import { create } from 'zustand'

/**
 * Loop activity store.
 * Only primitive flags are stored here.
 * Never persist Tone.js objects or DOM elements.
 */

interface LoopState {
  active: Record<string, boolean>
  start: (id: string) => void
  stop: (id: string) => void
}

export const useLoops = create<LoopState>((set) => ({
  active: {},
  start: (id: string) => set((s) => ({ active: { ...s.active, [id]: true } })),
  stop: (id: string) =>
    set((s) => {
      const { [id]: _, ...rest } = s.active
      return { active: rest }
    }),
}))
