'use client'
import { useState } from 'react'
import { useObjects } from '@/store/useObjects'
import { useAudioSettings } from '@/store/useAudioSettings'
import { GlassPanel, NeonButton } from '../ui/ModernUITheme'
import { Grid, Shuffle, Repeat2, Layers, Volume2 } from 'lucide-react'

interface Pattern {
  name: string
  description: string
  icon: typeof Grid
  generate: () => void
}

export default function PatternGenerator() {
  const addObject = useObjects(s => s.add)
  const clearAll = useObjects(s => s.clear)
  const { key, scale } = useAudioSettings()
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Music theory scales
  const scaleIntervals = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    pentatonic: [0, 2, 4, 7, 9],
    blues: [0, 3, 5, 6, 7, 10]
  }
  
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  
  const getScaleNotes = (rootNote: string, scaleType: string) => {
    const rootIndex = noteNames.indexOf(rootNote)
    const intervals = scaleIntervals[scaleType as keyof typeof scaleIntervals] || scaleIntervals.major
    
    return intervals.map(interval => {
      const noteIndex = (rootIndex + interval) % 12
      return noteNames[noteIndex]
    })
  }
  
  const generatePattern = async (patternFn: () => void) => {
    setIsGenerating(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500)) // Visual feedback
      patternFn()
    } finally {
      setIsGenerating(false)
    }
  }
  
  const patterns: Pattern[] = [
    {
      name: 'Circle of Fifths',
      description: 'Arrange notes in the circle of fifths progression',
      icon: Repeat2,
      generate: () => {
        clearAll()
        const scaleNotes = getScaleNotes(key, scale)
        const radius = 6
        
        scaleNotes.forEach((note, index) => {
          const angle = (index / scaleNotes.length) * Math.PI * 2
          
          addObject({
            type: 'note',
            position: {
              x: Math.cos(angle) * radius,
              y: 0,
              z: Math.sin(angle) * radius
            },
            shapeType: 'sphere',
            noteValue: note + '4',
            id: `circle-${index}`
          })
        })
      }
    },
    
    {
      name: 'Harmonic Stack',
      description: 'Create vertical chord progressions',
      icon: Layers,
      generate: () => {
        clearAll()
        const chordTypes = ['', 'm', '7', 'm7'] // Major, minor, dominant 7th, minor 7th
        const progressions = ['I', 'vi', 'IV', 'V'] // Popular progression
        
        progressions.forEach((roman, index) => {
          const x = (index - 1.5) * 4
          const chordType = chordTypes[index % chordTypes.length]
          
          // Root note
          addObject({
            type: 'chord',
            position: { x, y: 0, z: 0 },
            shapeType: 'torus',
            noteValue: key + '4',
            id: `chord-${index}-root`
          })
          
          // Third
          addObject({
            type: 'note',
            position: { x, y: 1.5, z: 0 },
            shapeType: 'icosahedron',
            noteValue: key + '4', // Simplified - would calculate proper third
            id: `chord-${index}-third`
          })
          
          // Fifth
          addObject({
            type: 'note',
            position: { x, y: 3, z: 0 },
            shapeType: 'octahedron',
            noteValue: key + '4', // Simplified - would calculate proper fifth
            id: `chord-${index}-fifth`
          })
        })
      }
    },
    
    {
      name: 'Rhythmic Grid',
      description: 'Generate a grid of rhythmic elements',
      icon: Grid,
      generate: () => {
        clearAll()
        const gridSize = 4
        const spacing = 3
        
        for (let x = 0; x < gridSize; x++) {
          for (let z = 0; z < gridSize; z++) {
            const posX = (x - gridSize / 2 + 0.5) * spacing
            const posZ = (z - gridSize / 2 + 0.5) * spacing
            
            // Vary the type based on position
            const type = (x + z) % 2 === 0 ? 'beat' : 'loop'
            const shapeType = type === 'beat' ? 'cylinder' : 'octahedron'
            
            addObject({
              type: type as any,
              position: { x: posX, y: -0.5, z: posZ },
              shapeType,
              noteValue: 'C2',
              id: `grid-${x}-${z}`
            })
          }
        }
      }
    },
    
    {
      name: 'Melodic Spiral',
      description: 'Create an ascending melodic spiral',
      icon: Volume2,
      generate: () => {
        clearAll()
        const scaleNotes = getScaleNotes(key, scale)
        const turns = 2
        const steps = 16
        
        for (let i = 0; i < steps; i++) {
          const t = i / steps
          const angle = t * turns * Math.PI * 2
          const radius = 2 + t * 4
          const height = t * 4 - 2
          
          const noteIndex = i % scaleNotes.length
          const octave = Math.floor(i / scaleNotes.length) + 3
          
          addObject({
            type: 'note',
            position: {
              x: Math.cos(angle) * radius,
              y: height,
              z: Math.sin(angle) * radius
            },
            shapeType: 'sphere',
            noteValue: scaleNotes[noteIndex] + octave,
            id: `spiral-${i}`
          })
        }
      }
    },
    
    {
      name: 'Random Constellation',
      description: 'Generate a random but harmonious arrangement',
      icon: Shuffle,
      generate: () => {
        clearAll()
        const scaleNotes = getScaleNotes(key, scale)
        const types: Array<'note' | 'chord' | 'beat' | 'loop'> = ['note', 'chord', 'beat', 'loop']
        const shapes = ['sphere', 'torus', 'icosahedron', 'octahedron', 'cylinder'] as const
        
        // Generate 12-16 objects
        const count = 12 + Math.floor(Math.random() * 5)
        
        for (let i = 0; i < count; i++) {
          const type = types[Math.floor(Math.random() * types.length)]
          const shape = shapes[Math.floor(Math.random() * shapes.length)]
          
          // Random position in a sphere
          const phi = Math.random() * Math.PI * 2
          const costheta = Math.random() * 2 - 1
          const theta = Math.acos(costheta)
          const radius = 3 + Math.random() * 5
          
          const x = radius * Math.sin(theta) * Math.cos(phi)
          const y = radius * Math.sin(theta) * Math.sin(phi) - 1
          const z = radius * Math.cos(theta)
          
          const noteIndex = Math.floor(Math.random() * scaleNotes.length)
          const octave = type === 'beat' ? '2' : Math.floor(Math.random() * 2) + 4
          
          addObject({
            type,
            position: { x, y, z },
            shapeType: shape,
            noteValue: scaleNotes[noteIndex] + octave,
            id: `constellation-${i}`
          })
        }
      }
    },
    
    {
      name: 'Call & Response',
      description: 'Create a call and response pattern',
      icon: Repeat2,
      generate: () => {
        clearAll()
        const scaleNotes = getScaleNotes(key, scale)
        
        // Call phrases (left side)
        for (let i = 0; i < 4; i++) {
          const noteIndex = i % scaleNotes.length
          addObject({
            type: 'note',
            position: {
              x: -6,
              y: i * 0.5 - 1,
              z: i * 2 - 3
            },
            shapeType: 'sphere',
            noteValue: scaleNotes[noteIndex] + '4',
            id: `call-${i}`
          })
        }
        
        // Response phrases (right side)
        for (let i = 0; i < 4; i++) {
          const noteIndex = (i + 2) % scaleNotes.length // Different notes for response
          addObject({
            type: 'chord',
            position: {
              x: 6,
              y: i * 0.5 - 1,
              z: i * 2 - 3
            },
            shapeType: 'torus',
            noteValue: scaleNotes[noteIndex] + '3',
            id: `response-${i}`
          })
        }
        
        // Rhythmic foundation
        addObject({
          type: 'beat',
          position: { x: 0, y: -2, z: 0 },
          shapeType: 'cylinder',
          noteValue: 'C2',
          id: 'foundation-beat'
        })
      }
    }
  ]

  return (
    <GlassPanel variant="dark" className="p-4 space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Grid className="w-5 h-5 text-green-400" />
        <h3 className="text-lg font-semibold text-white">Pattern Generator</h3>
      </div>
      
      <div className="text-sm text-white/60 mb-4">
        Generate musical patterns based on music theory in {key} {scale}
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {patterns.map((pattern, index) => (
          <div key={index} className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <pattern.icon className="w-5 h-5 text-cyan-400" />
                <div>
                  <div className="font-semibold text-white text-sm">{pattern.name}</div>
                  <div className="text-xs text-white/60">{pattern.description}</div>
                </div>
              </div>
              
              <NeonButton
                variant="primary"
                size="sm"
                onClick={() => generatePattern(pattern.generate)}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Generate'
                )}
              </NeonButton>
            </div>
          </div>
        ))}
      </div>
      
      <div className="pt-3 border-t border-white/10">
        <NeonButton
          variant="danger"
          size="sm"
          onClick={clearAll}
          className="w-full"
        >
          Clear All Shapes
        </NeonButton>
      </div>
    </GlassPanel>
  )
}