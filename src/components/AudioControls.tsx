'use client'
import React from 'react'
import { useShaderSettings } from '../store/useShaderSettings'

interface AudioControlsProps {
  onChange?: (value: number) => void
}

export function AudioControls({ onChange }: AudioControlsProps) {
  const bass = useShaderSettings((s) => s.bassSensitivity)
  const setBass = useShaderSettings((s) => s.setBassSensitivity)

  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setBass(val)
    onChange?.(val)
  }

  return (
    <div className="audio-controls fixed bottom-4 left-4 bg-black/50 p-2 rounded text-white">
      <label className="text-xs block">
        Bass Sensitivity
        <input
          type="range"
          min={0}
          max={2}
          step={0.01}
          defaultValue={bass}
          onChange={handle}
          className="w-32 ml-2"
        />
      </label>
    </div>
  )
}

