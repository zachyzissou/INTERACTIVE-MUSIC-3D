'use client'
import { create } from 'zustand'

interface ShaderSettingsState {
  bassSensitivity: number
  setBassSensitivity: (value: number) => void
}

export const useShaderSettings = create<ShaderSettingsState>((set) => ({
  bassSensitivity: 1,
  setBassSensitivity: (value) => set({ bassSensitivity: value })
}))

