'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface ShaderConfig {
  id: string
  name: string
  icon: React.ReactNode
  params: {
    [key: string]: {
      value: number
      min: number
      max: number
      step: number
      label: string
    }
  }
}

interface ShaderSelectorProps {
  shaderConfigs: ShaderConfig[]
  currentShader: string
  onShaderChange: (shaderId: string) => void
}

const ShaderSelector: React.FC<ShaderSelectorProps> = ({
  shaderConfigs,
  currentShader,
  onShaderChange
}) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-200 mb-3">Visual Shaders</h3>
      <div className="god-tier-shader-grid">
        {shaderConfigs.map((shader) => (
          <motion.button
            key={shader.id}
            onClick={() => onShaderChange(shader.id)}
            className={`
              god-tier-shader-button
              ${currentShader === shader.id ? 'active' : 'inactive'}
            `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={`Select ${shader.name} shader`}
          >
            <div className="text-lg">{shader.icon}</div>
            <span className="text-xs">{shader.name}</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

export default ShaderSelector
