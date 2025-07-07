'use client'
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'

export interface PanelConfig {
  id: string
  title: string
  component: React.ComponentType<any>
  defaultPosition?: { x: number; y: number }
  defaultSize?: { width: number; height: number }
  variant?: 'glass' | 'neon' | 'cyber' | 'minimal'
  isDraggable?: boolean
  isVisible?: boolean
  props?: Record<string, any>
}

interface UIManagerContextType {
  panels: Record<string, PanelConfig>
  visiblePanels: Set<string>
  showPanel: (id: string) => void
  hidePanel: (id: string) => void
  togglePanel: (id: string) => void
  registerPanel: (config: PanelConfig) => void
  unregisterPanel: (id: string) => void
  hideAllPanels: () => void
  showAllPanels: () => void
  isImmersiveMode: boolean
  setImmersiveMode: (immersive: boolean) => void
}

const UIManagerContext = createContext<UIManagerContextType | null>(null)

export function useUIManager() {
  const context = useContext(UIManagerContext)
  if (!context) {
    throw new Error('useUIManager must be used within a UIManagerProvider')
  }
  return context
}

interface UIManagerProviderProps {
  readonly children: React.ReactNode
}

export function UIManagerProvider({ children }: UIManagerProviderProps) {
  const [panels, setPanels] = useState<Record<string, PanelConfig>>({})
  const [visiblePanels, setVisiblePanels] = useState<Set<string>>(new Set())
  const [immersiveMode, setImmersiveMode] = useState(false)

  const showPanel = useCallback((id: string) => {
    setVisiblePanels(prev => new Set(prev).add(id))
  }, [])

  const hidePanel = useCallback((id: string) => {
    setVisiblePanels(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
  }, [])

  const togglePanel = useCallback((id: string) => {
    setVisiblePanels(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const registerPanel = useCallback((config: PanelConfig) => {
    setPanels(prev => ({
      ...prev,
      [config.id]: config,
    }))
    if (config.isVisible !== false) {
      showPanel(config.id)
    }
  }, [showPanel])

  const unregisterPanel = useCallback((id: string) => {
    setPanels(prev => {
      const newPanels = { ...prev }
      delete newPanels[id]
      return newPanels
    })
    hidePanel(id)
  }, [hidePanel])

  const hideAllPanels = useCallback(() => {
    setVisiblePanels(new Set())
  }, [])

  const showAllPanels = useCallback(() => {
    setVisiblePanels(new Set(Object.keys(panels)))
  }, [panels])

  const value = useMemo((): UIManagerContextType => ({
    panels,
    visiblePanels,
    showPanel,
    hidePanel,
    togglePanel,
    registerPanel,
    unregisterPanel,
    hideAllPanels,
    showAllPanels,
    isImmersiveMode: immersiveMode,
    setImmersiveMode,
  }), [
    panels,
    visiblePanels,
    showPanel,
    hidePanel,
    togglePanel,
    registerPanel,
    unregisterPanel,
    hideAllPanels,
    showAllPanels,
    immersiveMode,
  ])

  return (
    <UIManagerContext.Provider value={value}>
      {children}
    </UIManagerContext.Provider>
  )
}

export default UIManagerProvider
