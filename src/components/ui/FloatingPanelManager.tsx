'use client'
import { useState, useCallback } from 'react'
// import { useKeyboardControls } from '@react-three/drei'
// import DraggableControlPanel from './DraggableControlPanel'
// import VisualEffectsPanel from './VisualEffectsPanel'
// import PerformanceStatsPanel from './PerformanceStatsPanel'
// import ShowcaseExporter from './ShowcaseExporter'
import LiquidButton from '../LiquidButton'

interface PanelState {
  id: string
  visible: boolean
  position: [number, number, number]
  orbitRadius: number
  orbitSpeed: number
  theme: 'cyber' | 'glass' | 'neon' | 'plasma'
}

export default function FloatingPanelManager() {
  const [panels, setPanels] = useState<PanelState[]>([
    {
      id: 'controls',
      visible: true,
      position: [2, 1, -3],
      orbitRadius: 3,
      orbitSpeed: 0.1,
      theme: 'cyber'
    },
    {
      id: 'visuals',
      visible: true,
      position: [-2, 0.5, -3],
      orbitRadius: 2.5,
      orbitSpeed: -0.08,
      theme: 'neon'
    },
    {
      id: 'performance',
      visible: false,
      position: [0, -1.5, -3],
      orbitRadius: 2,
      orbitSpeed: 0.05,
      theme: 'glass'
    },
    {
      id: 'showcase',
      visible: false,
      position: [-3, 1, -2],
      orbitRadius: 2.8,
      orbitSpeed: -0.06,
      theme: 'cyber'
    }
  ])

  const [globalOrbitEnabled, setGlobalOrbitEnabled] = useState(true)
  const [currentTheme, setCurrentTheme] = useState('ethereal')

  // Keyboard shortcuts - TODO: implement later
  // const [, get] = useKeyboardControls()
  
  const togglePanel = useCallback((panelId: string) => {
    setPanels(prev => prev.map(panel => 
      panel.id === panelId 
        ? { ...panel, visible: !panel.visible }
        : panel
    ))
  }, [])

  const closePanel = useCallback((panelId: string) => {
    setPanels(prev => prev.map(panel => 
      panel.id === panelId 
        ? { ...panel, visible: false }
        : panel
    ))
  }, [])

  const toggleGlobalOrbit = useCallback(() => {
    setGlobalOrbitEnabled(prev => !prev)
  }, [])

  const handleThemeChange = useCallback((theme: string) => {
    setCurrentTheme(theme)
    // You can pass this to your main scene components
    // to update the global visual theme
  }, [])

  const handleEffectToggle = useCallback((effect: string, enabled: boolean) => {
    // Handle visual effect toggles
    console.log(`Effect ${effect} ${enabled ? 'enabled' : 'disabled'}`)
  }, [])

  const resetPanelPositions = useCallback(() => {
    setPanels([
      {
        id: 'controls',
        visible: true,
        position: [2, 1, -3],
        orbitRadius: 3,
        orbitSpeed: 0.1,
        theme: 'cyber'
      },
      {
        id: 'visuals',
        visible: true,
        position: [-2, 0.5, -3],
        orbitRadius: 2.5,
        orbitSpeed: -0.08,
        theme: 'neon'
      },
      {
        id: 'performance',
        visible: panels.find(p => p.id === 'performance')?.visible || false,
        position: [0, -1.5, -3],
        orbitRadius: 2,
        orbitSpeed: 0.05,
        theme: 'glass'
      },
      {
        id: 'showcase',
        visible: panels.find(p => p.id === 'showcase')?.visible || false,
        position: [-3, 1, -2],
        orbitRadius: 2.8,
        orbitSpeed: -0.06,
        theme: 'cyber'
      }
    ])
  }, [panels])

  const controlsPanel = panels.find(p => p.id === 'controls')
  const visualsPanel = panels.find(p => p.id === 'visuals')
  const performancePanel = panels.find(p => p.id === 'performance')
  const showcasePanel = panels.find(p => p.id === 'showcase')

  return (
    <>
      {/* Panel Components - Temporarily disabled for initial load */}
      {false && controlsPanel?.visible && (
        <div>Controls Panel Placeholder</div>
      )}

      {false && visualsPanel?.visible && (
        <div>Visuals Panel Placeholder</div>
      )}

      {false && performancePanel?.visible && (
        <div>Performance Panel Placeholder</div>
      )}

      {false && showcasePanel?.visible && (
        <div>Showcase Panel Placeholder</div>
      )}

      {/* Quick Access Menu - Fixed in screen space */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <div className="bg-black/50 backdrop-blur-md rounded-xl p-3 border border-white/20">
          <div className="text-xs text-white/70 mb-2 font-semibold">UI Panels</div>
          
          <div className="flex flex-col gap-2">
            <LiquidButton
              onClick={() => togglePanel('controls')}
              variant={controlsPanel?.visible ? 'primary' : 'secondary'}
              className="px-3 py-1 text-xs"
            >
              🎛️ Controls
            </LiquidButton>
            
            <LiquidButton
              onClick={() => togglePanel('visuals')}
              variant={visualsPanel?.visible ? 'primary' : 'secondary'}
              className="px-3 py-1 text-xs"
            >
              🎨 Visuals
            </LiquidButton>
            
            <LiquidButton
              onClick={() => togglePanel('performance')}
              variant={performancePanel?.visible ? 'primary' : 'secondary'}
              className="px-3 py-1 text-xs"
            >
              📊 Stats
            </LiquidButton>
            
            <LiquidButton
              onClick={() => togglePanel('showcase')}
              variant={showcasePanel?.visible ? 'primary' : 'secondary'}
              className="px-3 py-1 text-xs"
            >
              📸 Export
            </LiquidButton>
          </div>

          <div className="border-t border-white/20 mt-3 pt-2">
            <LiquidButton
              onClick={toggleGlobalOrbit}
              variant={globalOrbitEnabled ? 'accent' : 'secondary'}
              className="px-3 py-1 text-xs w-full mb-2"
            >
              {globalOrbitEnabled ? '🌍 Orbit ON' : '📍 Static'}
            </LiquidButton>
            
            <LiquidButton
              onClick={resetPanelPositions}
              variant="secondary"
              className="px-3 py-1 text-xs w-full"
            >
              🔄 Reset
            </LiquidButton>
          </div>

          {/* Current Theme Indicator */}
          <div className="mt-2 pt-2 border-t border-white/20 text-xs text-white/50">
            Theme: <span className="text-white/80 capitalize">{currentTheme}</span>
          </div>
        </div>

        {/* Keyboard Shortcuts Help */}
        <div className="bg-black/30 backdrop-blur-md rounded-lg p-2 border border-white/10">
          <div className="text-xs text-white/50 space-y-1">
            <div>• Drag panels to move</div>
            <div>• Click minimize to collapse</div>
            <div>• Press H to hide all</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes panelGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(255,255,255,0.1); }
          50% { box-shadow: 0 0 30px rgba(255,255,255,0.2); }
        }
      `}</style>
    </>
  )
}