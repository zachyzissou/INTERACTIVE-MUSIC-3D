import { create } from 'zustand'

interface LoopState {
  active: Record<string, boolean>
  start: (id: string) => void
  stop: (id: string) => void
}

export const useLoops = create<LoopState>((set) => ({
  active: {},
  start: (id) => set((s) => ({ active: { ...s.active, [id]: true } })),
  stop: (id) =>
    set((s) => {
      const { [id]: _, ...rest } = s.active
      return { active: rest }
    }),
}))
