import { create } from 'zustand'

export interface EffectParams {
  reverb: number
  delay: number
  lowpass: number
  highpass: number
}

export const defaultEffectParams: EffectParams = {
  reverb: 0,
  delay: 0,
  lowpass: 20000,
  highpass: 0,
}

interface EffectState {
  effects: Record<string, EffectParams>
  selected: string | null
  select: (id: string | null) => void
  setEffect: (id: string, params: Partial<EffectParams>) => void
  getParams: (id: string) => EffectParams
}

export const useEffectSettings = create<EffectState>((set, get) => ({
  effects: {},
  selected: null,
  select: (id) => {
    if (id === null) return set({ selected: null })
    const effects = get().effects
    if (!effects[id]) {
      set({ effects: { ...effects, [id]: { ...defaultEffectParams } }, selected: id })
    } else {
      set({ selected: id })
    }
  },
  setEffect: (id, params) =>
    set((state) => ({
      effects: {
        ...state.effects,
        [id]: { ...(state.effects[id] || defaultEffectParams), ...params },
      },
    })),
  getParams: (id) => get().effects[id] || defaultEffectParams,
}))
