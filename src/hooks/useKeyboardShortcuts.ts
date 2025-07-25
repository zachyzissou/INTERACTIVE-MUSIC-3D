import { useEffect } from 'react'
import { useObjects } from '@/store/useObjects'
import { useSelectedShape } from '@/store/useSelectedShape'
import { useAudioSettings } from '@/store/useAudioSettings'
import { triggerSound } from '@/lib/soundTriggers'

export function useKeyboardShortcuts() {
  const objects = useObjects(s => s.objects)
  const addObject = useObjects(s => s.add)
  const removeObject = useObjects(s => s.remove)
  const selected = useSelectedShape(s => s.selected)
  const selectShape = useSelectedShape(s => s.selectShape)
  const { volume, setVolume } = useAudioSettings()
  
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      const key = e.key.toLowerCase()
      const isCtrlOrCmd = e.ctrlKey || e.metaKey
      const isShift = e.shiftKey
      
      // Prevent default for our shortcuts
      const preventDefault = () => {
        e.preventDefault()
        e.stopPropagation()
      }
      
      // Number keys 1-8: Select shape
      if (key >= '1' && key <= '8') {
        const index = parseInt(key) - 1
        if (objects[index]) {
          preventDefault()
          selectShape(objects[index].id)
        }
      }
      
      // Space: Play selected shape
      else if (key === ' ' && selected) {
        preventDefault()
        const obj = objects.find(o => o.id === selected)
        if (obj) {
          await triggerSound(obj.type, obj.id)
        }
      }
      
      // Q/W/E/R: Change sound type
      else if (['q', 'w', 'e', 'r'].includes(key) && selected) {
        preventDefault()
        const typeMap = { q: 'note', w: 'chord', e: 'beat', r: 'loop' } as const
        const obj = objects.find(o => o.id === selected)
        if (obj) {
          obj.type = typeMap[key as keyof typeof typeMap]
        }
      }
      
      // A/D: Previous/Next shape
      else if (key === 'a' || key === 'd') {
        preventDefault()
        const currentIndex = objects.findIndex(o => o.id === selected)
        if (currentIndex !== -1) {
          const newIndex = key === 'a' 
            ? (currentIndex - 1 + objects.length) % objects.length
            : (currentIndex + 1) % objects.length
          selectShape(objects[newIndex].id)
        }
      }
      
      // Delete/Backspace: Remove selected shape
      else if ((key === 'delete' || key === 'backspace') && selected) {
        preventDefault()
        removeObject(selected)
        selectShape(null)
      }
      
      // Ctrl/Cmd + A: Select all
      else if (isCtrlOrCmd && key === 'a') {
        preventDefault()
        // For now, just select the first shape
        if (objects.length > 0) {
          selectShape(objects[0].id)
        }
      }
      
      // Ctrl/Cmd + S: Save session
      else if (isCtrlOrCmd && key === 's') {
        preventDefault()
        const session = {
          objects,
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
        localStorage.setItem('musicSession', JSON.stringify(session))
        
        // Visual feedback
        const notification = document.createElement('div')
        notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50'
        notification.textContent = '✓ Session saved'
        document.body.appendChild(notification)
        setTimeout(() => notification.remove(), 2000)
      }
      
      // N: Add new shape
      else if (key === 'n' && !isCtrlOrCmd) {
        preventDefault()
        const angle = Math.random() * Math.PI * 2
        const radius = 5 + Math.random() * 3
        
        addObject({
          type: 'note',
          position: {
            x: Math.cos(angle) * radius,
            y: Math.random() * 2 - 1,
            z: Math.sin(angle) * radius
          },
          shapeType: 'sphere',
          noteValue: 'C4'
        })
      }
      
      // +/-: Volume control
      else if (key === '+' || key === '=' || key === '-') {
        preventDefault()
        const newVolume = key === '-' 
          ? Math.max(0, volume - 0.1)
          : Math.min(1, volume + 0.1)
        setVolume(newVolume)
      }
      
      // Escape: Deselect
      else if (key === 'escape') {
        preventDefault()
        selectShape(null)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [objects, selected, volume, addObject, removeObject, selectShape, setVolume])
}