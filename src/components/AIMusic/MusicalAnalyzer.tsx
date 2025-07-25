'use client'
import { useState, useEffect, useMemo } from 'react'
import { useObjects } from '@/store/useObjects'
import { useAudioSettings } from '@/store/useAudioSettings'
import { GlassPanel, NeonButton } from '../ui/ModernUITheme'
import { BarChart3, TrendingUp, Lightbulb, Target, Zap } from 'lucide-react'
import * as Tone from 'tone'

interface MusicalAnalysis {
  key: string
  scale: string
  complexity: number
  harmony: number
  rhythm: number
  suggestions: string[]
  missingElements: string[]
  strengths: string[]
}

interface ChordProgression {
  chords: string[]
  quality: 'consonant' | 'dissonant' | 'mixed'
  progression: string
}

export default function MusicalAnalyzer() {
  const objects = useObjects(s => s.objects)
  const addObject = useObjects(s => s.add)
  const { key, scale } = useAudioSettings()
  const [analysis, setAnalysis] = useState<MusicalAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  // Music theory mappings
  const scaleIntervals = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    pentatonic: [0, 2, 4, 7, 9],
    blues: [0, 3, 5, 6, 7, 10]
  }
  
  const chordProgressions = {
    major: ['I', 'V', 'vi', 'IV'], // Popular progression
    minor: ['i', 'VII', 'VI', 'VII'],
    pentatonic: ['I', 'IV', 'V'],
    blues: ['I', 'IV', 'V', 'I']
  }
  
  // Convert note name to semitone
  const noteToSemitone = (note: string): number => {
    const noteMap: { [key: string]: number } = {
      'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
      'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
      'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
    }
    return noteMap[note.replace(/\d/g, '')] || 0
  }
  
  // Analyze the current composition
  const analyzeComposition = async () => {
    setIsAnalyzing(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate analysis time
      
      const noteObjects = objects.filter(obj => obj.type === 'note' && obj.noteValue)
      const chordObjects = objects.filter(obj => obj.type === 'chord')
      const beatObjects = objects.filter(obj => obj.type === 'beat')
      const loopObjects = objects.filter(obj => obj.type === 'loop')
      
      // Extract notes
      const notes = noteObjects.map(obj => obj.noteValue).filter(Boolean) as string[]
      const semitones = notes.map(noteToSemitone)
      
      // Detect key
      const detectedKey = detectKey(semitones)
      
      // Calculate complexity (0-1)
      const complexity = Math.min(
        (notes.length + chordObjects.length * 2 + beatObjects.length * 0.5) / 20,
        1
      )
      
      // Calculate harmony score
      const harmony = calculateHarmony(semitones, detectedKey)
      
      // Calculate rhythm score
      const rhythm = Math.min(
        (beatObjects.length + loopObjects.length * 2) / 10,
        1
      )
      
      // Generate suggestions
      const suggestions = generateSuggestions(
        noteObjects.length,
        chordObjects.length,
        beatObjects.length,
        loopObjects.length,
        harmony,
        complexity
      )
      
      // Identify missing elements
      const missingElements = identifyMissingElements(
        noteObjects.length,
        chordObjects.length,
        beatObjects.length,
        loopObjects.length
      )
      
      // Identify strengths
      const strengths = identifyStrengths(
        noteObjects.length,
        chordObjects.length,
        beatObjects.length,
        loopObjects.length,
        harmony,
        complexity
      )
      
      setAnalysis({
        key: detectedKey,
        scale: scale,
        complexity,
        harmony,
        rhythm,
        suggestions,
        missingElements,
        strengths
      })
      
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }
  
  const detectKey = (semitones: number[]): string => {
    if (semitones.length === 0) return key
    
    // Simple key detection based on note frequency
    const noteCounts = Array(12).fill(0)
    semitones.forEach(note => {
      noteCounts[note % 12]++
    })
    
    const dominantNote = noteCounts.indexOf(Math.max(...noteCounts))
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    
    return noteNames[dominantNote]
  }
  
  const calculateHarmony = (semitones: number[], detectedKey: string): number => {
    if (semitones.length < 2) return 0.5
    
    const keyOffset = noteToSemitone(detectedKey)
    const scaleNotes = scaleIntervals[scale as keyof typeof scaleIntervals] || scaleIntervals.major
    const normalizedScaleNotes = scaleNotes.map(interval => (interval + keyOffset) % 12)
    
    // Check how many notes fit in the scale
    const inScaleCount = semitones.filter(note => 
      normalizedScaleNotes.includes(note % 12)
    ).length
    
    return inScaleCount / semitones.length
  }
  
  const generateSuggestions = (
    notes: number,
    chords: number,
    beats: number,
    loops: number,
    harmony: number,
    complexity: number
  ): string[] => {
    const suggestions: string[] = []
    
    if (notes < 3) {
      suggestions.push("Add more melodic notes to create a stronger melody")
    }
    
    if (chords === 0 && notes > 2) {
      suggestions.push("Add chord shapes to provide harmonic support")
    }
    
    if (beats === 0) {
      suggestions.push("Add percussion elements to establish rhythm")
    }
    
    if (loops === 0 && beats > 0) {
      suggestions.push("Create loops to add rhythmic continuity")
    }
    
    if (harmony < 0.7) {
      suggestions.push(`Consider staying in ${key} ${scale} scale for better harmony`)
    }
    
    if (complexity < 0.3) {
      suggestions.push("Your composition could benefit from more variation")
    }
    
    if (complexity > 0.8) {
      suggestions.push("Consider simplifying - sometimes less is more")
    }
    
    // Advanced suggestions
    if (notes > 5 && chords > 2) {
      suggestions.push("Try using the AI composer to generate variations")
    }
    
    if (beats > 3) {
      suggestions.push("Experiment with different drum patterns")
    }
    
    return suggestions.slice(0, 4) // Limit to most important suggestions
  }
  
  const identifyMissingElements = (
    notes: number,
    chords: number,
    beats: number,
    loops: number
  ): string[] => {
    const missing: string[] = []
    
    if (notes === 0) missing.push("Melody")
    if (chords === 0) missing.push("Harmony")
    if (beats === 0) missing.push("Percussion")
    if (loops === 0) missing.push("Rhythmic loops")
    
    return missing
  }
  
  const identifyStrengths = (
    notes: number,
    chords: number,
    beats: number,
    loops: number,
    harmony: number,
    complexity: number
  ): string[] => {
    const strengths: string[] = []
    
    if (notes >= 5) strengths.push("Rich melodic content")
    if (chords >= 3) strengths.push("Good harmonic foundation")
    if (beats >= 2) strengths.push("Solid rhythmic base")
    if (loops >= 1) strengths.push("Dynamic rhythm patterns")
    if (harmony >= 0.8) strengths.push("Excellent harmony")
    if (complexity >= 0.5 && complexity <= 0.7) strengths.push("Well-balanced complexity")
    
    return strengths
  }
  
  const applySuggestion = (suggestion: string) => {
    // Auto-generate based on suggestion
    const angle = Math.random() * Math.PI * 2
    const radius = 5 + Math.random() * 2
    
    if (suggestion.includes("melodic notes")) {
      // Add a note in the current scale
      const scaleNotes = scaleIntervals[scale as keyof typeof scaleIntervals] || scaleIntervals.major
      const keyOffset = noteToSemitone(key)
      const noteIndex = Math.floor(Math.random() * scaleNotes.length)
      const semitone = (scaleNotes[noteIndex] + keyOffset) % 12
      
      const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
      const noteName = noteNames[semitone] + '4'
      
      addObject({
        type: 'note',
        position: {
          x: Math.cos(angle) * radius,
          y: Math.random() * 2 - 1,
          z: Math.sin(angle) * radius
        },
        shapeType: 'sphere',
        noteValue: noteName,
        id: `suggestion-note-${Date.now()}`
      })
    } else if (suggestion.includes("chord")) {
      addObject({
        type: 'chord',
        position: {
          x: Math.cos(angle) * radius,
          y: Math.random() * 2 - 1,
          z: Math.sin(angle) * radius
        },
        shapeType: 'torus',
        noteValue: key + '4',
        id: `suggestion-chord-${Date.now()}`
      })
    } else if (suggestion.includes("percussion") || suggestion.includes("beat")) {
      addObject({
        type: 'beat',
        position: {
          x: Math.cos(angle) * radius,
          y: -1.5,
          z: Math.sin(angle) * radius
        },
        shapeType: 'cylinder',
        noteValue: 'C2',
        id: `suggestion-beat-${Date.now()}`
      })
    } else if (suggestion.includes("loop")) {
      addObject({
        type: 'loop',
        position: {
          x: Math.cos(angle) * radius,
          y: Math.random() * 2 - 1,
          z: Math.sin(angle) * radius
        },
        shapeType: 'octahedron',
        noteValue: key + '3',
        id: `suggestion-loop-${Date.now()}`
      })
    }
  }

  return (
    <GlassPanel variant="dark" className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Musical Analysis</h3>
        </div>
        
        <NeonButton
          variant="primary"
          size="sm"
          onClick={analyzeComposition}
          disabled={isAnalyzing || objects.length === 0}
        >
          {isAnalyzing ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing...</span>
            </div>
          ) : (
            <>
              <TrendingUp className="w-4 h-4 mr-2" />
              Analyze
            </>
          )}
        </NeonButton>
      </div>
      
      {objects.length === 0 && (
        <div className="text-center py-6 text-white/60">
          <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Add some shapes to analyze your composition</p>
        </div>
      )}
      
      {analysis && (
        <div className="space-y-4">
          {/* Analysis Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-cyan-400">
                {(analysis.complexity * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-white/60">Complexity</div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-green-400">
                {(analysis.harmony * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-white/60">Harmony</div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-yellow-400">
                {(analysis.rhythm * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-white/60">Rhythm</div>
            </div>
          </div>
          
          {/* Key and Scale */}
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-sm text-white/80 mb-1">Detected Key</div>
            <div className="text-lg font-semibold text-white">
              {analysis.key} {analysis.scale}
            </div>
          </div>
          
          {/* Strengths */}
          {analysis.strengths.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-green-400" />
                <span className="text-sm font-semibold text-white">Strengths</span>
              </div>
              <div className="space-y-1">
                {analysis.strengths.map((strength, index) => (
                  <div key={index} className="text-sm text-green-300 flex items-center space-x-2">
                    <div className="w-1 h-1 bg-green-400 rounded-full" />
                    <span>{strength}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Suggestions */}
          {analysis.suggestions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-semibold text-white">Suggestions</span>
              </div>
              <div className="space-y-2">
                {analysis.suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start justify-between bg-white/5 rounded-lg p-2">
                    <span className="text-sm text-white/80 flex-1">{suggestion}</span>
                    <NeonButton
                      variant="secondary"
                      size="sm"
                      onClick={() => applySuggestion(suggestion)}
                      className="ml-2 text-xs px-2 py-1"
                    >
                      Apply
                    </NeonButton>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Missing Elements */}
          {analysis.missingElements.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-semibold text-white">Missing Elements</span>
              <div className="flex flex-wrap gap-2">
                {analysis.missingElements.map((element, index) => (
                  <span key={index} className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs">
                    {element}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </GlassPanel>
  )
}