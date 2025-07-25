'use client'
import { useState, useEffect, useRef } from 'react'
import { magentaModels, toneToMagentaNote, magentaToToneNotes } from '@/lib/magenta-models'
import { GlassPanel, NeonButton, NeonSlider, NeonToggle } from '../ui/ModernUITheme'
import { Brain, Wand2, Music, Repeat, Download, Play, Pause } from 'lucide-react'
import * as mm from '@magenta/music'
import * as Tone from 'tone'
import { useObjects } from '@/store/useObjects'
import { useAudioSettings } from '@/store/useAudioSettings'
import gsap from 'gsap'

interface AISettings {
  temperature: number
  steps: number
  enableHarmonization: boolean
  enableRhythmGeneration: boolean
  creativityLevel: number
  modelType: 'melody' | 'performance' | 'drums'
}

export default function AIComposer() {
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentSequence, setCurrentSequence] = useState<mm.NoteSequence | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [modelLoadProgress, setModelLoadProgress] = useState(0)
  const [generatedNotes, setGeneratedNotes] = useState<any[]>([])
  
  const objects = useObjects(s => s.objects)
  const addObject = useObjects(s => s.add)
  const { key, bpm } = useAudioSettings()
  
  const [aiSettings, setAISettings] = useState<AISettings>({
    temperature: 1.0,
    steps: 32,
    enableHarmonization: true,
    enableRhythmGeneration: false,
    creativityLevel: 0.7,
    modelType: 'melody'
  })
  
  const synthRef = useRef<Tone.PolySynth | null>(null)
  const sequenceRef = useRef<Tone.Part | null>(null)
  
  useEffect(() => {
    // Initialize synth for playback
    synthRef.current = new Tone.PolySynth().toDestination()
    
    return () => {
      if (synthRef.current) {
        synthRef.current.dispose()
      }
      if (sequenceRef.current) {
        sequenceRef.current.stop()
        sequenceRef.current.dispose()
      }
    }
  }, [])
  
  const loadModel = async (modelType: string) => {
    setIsLoading(true)
    setModelLoadProgress(0)
    
    try {
      // Simulate loading progress
      const progressInterval = setInterval(() => {
        setModelLoadProgress(prev => Math.min(prev + 10, 90))
      }, 200)
      
      await magentaModels.loadModel(modelType)
      
      clearInterval(progressInterval)
      setModelLoadProgress(100)
      
      // Visual feedback
      const button = document.getElementById(`load-${modelType}`)
      if (button) {
        gsap.to(button, {
          scale: 1.1,
          duration: 0.2,
          yoyo: true,
          repeat: 1
        })
      }
      
    } catch (error) {
      console.error('Failed to load model:', error)
    } finally {
      setIsLoading(false)
      setTimeout(() => setModelLoadProgress(0), 1000)
    }
  }
  
  const generateFromUserInput = async () => {
    if (objects.length === 0) {
      alert('Please add some shapes first to generate based on your composition!')
      return
    }
    
    setIsGenerating(true)
    
    try {
      // Convert user's current composition to Magenta format
      const userNotes: mm.Note[] = []
      let time = 0
      
      objects.forEach((obj, index) => {
        if (obj.noteValue && obj.type === 'note') {
          userNotes.push(toneToMagentaNote(obj.noteValue, time, 0.5))
          time += 0.5
        }
      })
      
      if (userNotes.length === 0) {
        // Create a simple seed if no notes
        userNotes.push(toneToMagentaNote('C4', 0, 0.5))
      }
      
      const seedSequence: mm.NoteSequence = {
        notes: userNotes,
        totalTime: time,
        ticksPerQuarter: 220,
        timeSignatures: [{ time: 0, numerator: 4, denominator: 4 }],
        tempos: [{ time: 0, qpm: bpm }]
      }
      
      // Generate continuation
      const generatedSequence = await magentaModels.generateMelody(
        seedSequence,
        aiSettings.steps,
        aiSettings.temperature,
        aiSettings.modelType === 'melody' ? 'melodyRnn' : 'performanceRnn'
      )
      
      setCurrentSequence(generatedSequence)
      
      // Convert to playable format
      const playableNotes = magentaToToneNotes(generatedSequence)
      setGeneratedNotes(playableNotes)
      
      // Add generated notes as new objects in scene
      if (aiSettings.enableHarmonization) {
        playableNotes.slice(userNotes.length).forEach((note, index) => {
          const angle = (index / playableNotes.length) * Math.PI * 2 + Math.PI
          const radius = 7 + Math.random() * 2
          
          addObject({
            type: 'note',
            position: {
              x: Math.cos(angle) * radius,
              y: Math.sin(index * 0.5) * 0.5,
              z: Math.sin(angle) * radius
            },
            shapeType: 'icosahedron',
            noteValue: note.note,
            id: `ai-generated-${index}`
          })
        })
      }
      
    } catch (error) {
      console.error('Generation failed:', error)
      alert('Failed to generate music. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }
  
  const generateDrumPattern = async () => {
    setIsGenerating(true)
    
    try {
      const drumSequence = await magentaModels.generateDrums(undefined, 2, aiSettings.temperature)
      
      // Convert drum notes to beat objects
      const drumNotes = magentaToToneNotes(drumSequence)
      
      drumNotes.forEach((note, index) => {
        const angle = (index / drumNotes.length) * Math.PI * 2
        const radius = 3
        
        addObject({
          type: 'beat',
          position: {
            x: Math.cos(angle) * radius,
            y: -1,
            z: Math.sin(angle) * radius
          },
          shapeType: 'cylinder',
          noteValue: note.note,
          id: `drum-${index}`
        })
      })
      
    } catch (error) {
      console.error('Drum generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }
  
  const playGeneratedSequence = async () => {
    if (!currentSequence || !synthRef.current) return
    
    if (sequenceRef.current) {
      sequenceRef.current.stop()
      sequenceRef.current.dispose()
    }
    
    const notes = magentaToToneNotes(currentSequence)
    
    sequenceRef.current = new Tone.Part((time, note) => {
      synthRef.current?.triggerAttackRelease(note.note, note.duration, time, note.velocity)
    }, notes.map(note => [note.time, note]))
    
    sequenceRef.current.start(0)
    Tone.Transport.start()
    
    setIsPlaying(true)
    
    // Stop after sequence duration
    setTimeout(() => {
      setIsPlaying(false)
      Tone.Transport.stop()
    }, currentSequence.totalTime * 1000)
  }
  
  const stopPlayback = () => {
    if (sequenceRef.current) {
      sequenceRef.current.stop()
    }
    Tone.Transport.stop()
    setIsPlaying(false)
  }
  
  const exportSequence = () => {
    if (!currentSequence) return
    
    const midi = mm.sequenceProtoToMidi(currentSequence)
    const blob = new Blob([midi], { type: 'audio/midi' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-composition-${Date.now()}.mid`
    a.click()
    
    URL.revokeObjectURL(url)
  }

  return (
    <GlassPanel variant="neon" className="p-6 space-y-6" glow>
      <div className="flex items-center space-x-3 mb-4">
        <Brain className="w-6 h-6 text-purple-400" />
        <h2 className="text-xl font-bold text-white">AI Composer</h2>
        {isLoading && (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-purple-300">{modelLoadProgress}%</span>
          </div>
        )}
      </div>
      
      {/* Model Selection */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white/80">AI Model</h3>
        <div className="grid grid-cols-3 gap-2">
          {(['melody', 'performance', 'drums'] as const).map(type => (
            <NeonButton
              key={type}
              id={`load-${type}`}
              variant={aiSettings.modelType === type ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => {
                setAISettings(prev => ({ ...prev, modelType: type }))
                loadModel(type === 'melody' ? 'melodyRnn' : type === 'performance' ? 'performanceRnn' : 'drumRnn')
              }}
              disabled={isLoading}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </NeonButton>
          ))}
        </div>
      </div>
      
      {/* AI Parameters */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white/80">Generation Settings</h3>
        
        <NeonSlider
          label="Creativity"
          value={aiSettings.temperature}
          onChange={(v) => setAISettings(prev => ({ ...prev, temperature: v }))}
          min={0.1}
          max={2.0}
          step={0.1}
          color="#ff00ff"
        />
        
        <NeonSlider
          label="Length (bars)"
          value={aiSettings.steps / 8}
          onChange={(v) => setAISettings(prev => ({ ...prev, steps: v * 8 }))}
          min={1}
          max={8}
          step={1}
          color="#00ffff"
        />
        
        <div className="space-y-2">
          <NeonToggle
            label="Harmonization"
            checked={aiSettings.enableHarmonization}
            onChange={(checked) => setAISettings(prev => ({ ...prev, enableHarmonization: checked }))}
            color="#00ff00"
          />
          
          <NeonToggle
            label="Rhythm Generation"
            checked={aiSettings.enableRhythmGeneration}
            onChange={(checked) => setAISettings(prev => ({ ...prev, enableRhythmGeneration: checked }))}
            color="#ffff00"
          />
        </div>
      </div>
      
      {/* Generation Controls */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <NeonButton
            variant="primary"
            onClick={generateFromUserInput}
            disabled={isGenerating || isLoading}
          >
            <Wand2 className="w-4 h-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate Melody'}
          </NeonButton>
          
          <NeonButton
            variant="accent"
            onClick={generateDrumPattern}
            disabled={isGenerating || isLoading}
          >
            <Music className="w-4 h-4 mr-2" />
            Generate Drums
          </NeonButton>
        </div>
        
        {currentSequence && (
          <div className="flex space-x-2">
            <NeonButton
              variant="secondary"
              size="sm"
              onClick={isPlaying ? stopPlayback : playGeneratedSequence}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </NeonButton>
            
            <NeonButton
              variant="secondary"
              size="sm"
              onClick={exportSequence}
            >
              <Download className="w-4 h-4" />
            </NeonButton>
          </div>
        )}
      </div>
      
      {/* Generated Sequence Info */}
      {currentSequence && (
        <div className="bg-white/5 rounded-lg p-3 backdrop-blur-sm">
          <div className="text-sm text-white/80">
            Generated: {currentSequence.notes.length} notes, {currentSequence.totalTime.toFixed(1)}s
          </div>
          <div className="w-full bg-white/10 rounded-full h-2 mt-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
              style={{ width: isPlaying ? '100%' : '0%' }}
            />
          </div>
        </div>
      )}
    </GlassPanel>
  )
}