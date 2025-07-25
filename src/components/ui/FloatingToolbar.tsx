'use client'
import { useState, useEffect } from 'react'
import { GlassPanel, NeonButton, Tooltip } from './ModernUITheme'
import { 
  Plus, 
  Trash2, 
  Save, 
  Download, 
  Share2, 
  Layers, 
  Zap, 
  RefreshCw,
  Settings,
  HelpCircle 
} from 'lucide-react'
import { useObjects } from '@/store/useObjects'
import { useSelectedShape } from '@/store/useSelectedShape'
import gsap from 'gsap'

export default function FloatingToolbar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)
  
  const objects = useObjects(s => s.objects)
  const addObject = useObjects(s => s.add)
  const removeObject = useObjects(s => s.remove)
  const clearAll = useObjects(s => s.clear)
  const selected = useSelectedShape(s => s.selected)
  
  const shapeTypes = [
    { type: 'note', label: 'Note', color: '#00ffff' },
    { type: 'chord', label: 'Chord', color: '#ff00ff' },
    { type: 'beat', label: 'Beat', color: '#ffff00' },
    { type: 'loop', label: 'Loop', color: '#00ff00' },
  ]
  
  useEffect(() => {
    // Animate toolbar entrance
    const toolbar = document.getElementById('floating-toolbar')
    if (toolbar) {
      gsap.from(toolbar, {
        y: -100,
        opacity: 0,
        duration: 0.5,
        delay: 1,
        ease: 'power3.out'
      })
    }
  }, [])
  
  const handleAddShape = (type: string) => {
    // Calculate position for new shape
    const angle = Math.random() * Math.PI * 2
    const radius = 5 + Math.random() * 3
    
    addObject({
      type: type as any,
      position: {
        x: Math.cos(angle) * radius,
        y: Math.random() * 2 - 1,
        z: Math.sin(angle) * radius
      },
      shapeType: 'sphere',
      noteValue: 'C4'
    })
    
    setShowAddMenu(false)
    
    // Visual feedback
    const button = document.querySelector(`[data-shape-type="${type}"]`)
    if (button) {
      gsap.to(button, {
        scale: 1.2,
        duration: 0.1,
        yoyo: true,
        repeat: 1
      })
    }
  }
  
  const handleSave = () => {
    const session = {
      objects,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }
    
    localStorage.setItem('musicSession', JSON.stringify(session))
    
    // Visual feedback
    const saveButton = document.getElementById('save-button')
    if (saveButton) {
      gsap.to(saveButton, {
        rotate: 360,
        duration: 0.5,
        ease: 'power2.inOut'
      })
    }
  }
  
  const handleClearAll = () => {
    if (confirm('Clear all shapes? This cannot be undone.')) {
      clearAll()
    }
  }

  return (
    <div
      id="floating-toolbar"
      className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40"
    >
      <GlassPanel 
        variant="dark" 
        className={`transition-all duration-300 ${isCollapsed ? 'p-2' : 'p-3'}`}
      >
        <div className="flex items-center space-x-2">
          {!isCollapsed && (
            <>
              {/* Add Shape Button */}
              <div className="relative">
                <Tooltip content="Add Shape">
                  <NeonButton
                    variant="primary"
                    size="sm"
                    onClick={() => setShowAddMenu(!showAddMenu)}
                  >
                    <Plus className="w-4 h-4" />
                  </NeonButton>
                </Tooltip>
                
                {/* Add Shape Menu */}
                {showAddMenu && (
                  <div className="absolute top-full mt-2 left-0 bg-black/90 backdrop-blur-xl rounded-lg p-2 space-y-1 min-w-[120px] shadow-xl border border-white/10">
                    {shapeTypes.map(shape => (
                      <button
                        key={shape.type}
                        data-shape-type={shape.type}
                        onClick={() => handleAddShape(shape.type)}
                        className="w-full text-left px-3 py-2 rounded hover:bg-white/10 transition-colors text-sm text-white flex items-center justify-between"
                      >
                        <span>{shape.label}</span>
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: shape.color }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Delete Button */}
              <Tooltip content="Delete Selected">
                <NeonButton
                  variant="danger"
                  size="sm"
                  onClick={() => selected && removeObject(selected)}
                  disabled={!selected}
                >
                  <Trash2 className="w-4 h-4" />
                </NeonButton>
              </Tooltip>
              
              <div className="w-px h-6 bg-white/20" />
              
              {/* Save Button */}
              <Tooltip content="Save Session">
                <NeonButton
                  id="save-button"
                  variant="secondary"
                  size="sm"
                  onClick={handleSave}
                >
                  <Save className="w-4 h-4" />
                </NeonButton>
              </Tooltip>
              
              {/* Export Button */}
              <Tooltip content="Export">
                <NeonButton
                  variant="secondary"
                  size="sm"
                  onClick={() => {}}
                >
                  <Download className="w-4 h-4" />
                </NeonButton>
              </Tooltip>
              
              {/* Share Button */}
              <Tooltip content="Share">
                <NeonButton
                  variant="secondary"
                  size="sm"
                  onClick={() => {}}
                >
                  <Share2 className="w-4 h-4" />
                </NeonButton>
              </Tooltip>
              
              <div className="w-px h-6 bg-white/20" />
              
              {/* Clear All */}
              <Tooltip content="Clear All">
                <NeonButton
                  variant="danger"
                  size="sm"
                  onClick={handleClearAll}
                >
                  <RefreshCw className="w-4 h-4" />
                </NeonButton>
              </Tooltip>
              
              {/* AI Mode */}
              <Tooltip content="AI Mode">
                <NeonButton
                  variant="accent"
                  size="sm"
                  onClick={() => {}}
                >
                  <Zap className="w-4 h-4" />
                </NeonButton>
              </Tooltip>
              
              <div className="w-px h-6 bg-white/20" />
              
              {/* Help */}
              <Tooltip content="Help (H)">
                <NeonButton
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const event = new KeyboardEvent('keydown', { key: 'h' })
                    window.dispatchEvent(event)
                  }}
                >
                  <HelpCircle className="w-4 h-4" />
                </NeonButton>
              </Tooltip>
            </>
          )}
          
          {/* Collapse Toggle */}
          <Tooltip content={isCollapsed ? "Expand" : "Collapse"}>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded hover:bg-white/10 transition-colors text-white/60 hover:text-white"
            >
              <Layers className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      </GlassPanel>
      
      {/* Object count badge */}
      {objects.length > 0 && (
        <div className="absolute -bottom-2 -right-2 bg-cyan-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg">
          {objects.length}
        </div>
      )}
    </div>
  )
}