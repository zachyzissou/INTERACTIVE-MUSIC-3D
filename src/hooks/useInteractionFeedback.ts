'use client'
import { useState, useCallback } from 'react'
import { nanoid } from 'nanoid'

interface FeedbackInstance {
  id: string
  type: 'click' | 'hover' | 'success' | 'error' | 'audio-trigger'
  position: [number, number, number]
  color?: string
  duration?: number
}

export function useInteractionFeedback() {
  const [feedbacks, setFeedbacks] = useState<FeedbackInstance[]>([])

  const triggerFeedback = useCallback((
    type: FeedbackInstance['type'],
    position: [number, number, number],
    options?: { color?: string; duration?: number }
  ) => {
    const feedback: FeedbackInstance = {
      id: nanoid(),
      type,
      position,
      color: options?.color || getDefaultColor(type),
      duration: options?.duration || getDefaultDuration(type)
    }

    setFeedbacks(prev => [...prev, feedback])

    // Auto-remove after duration
    setTimeout(() => {
      setFeedbacks(prev => prev.filter(f => f.id !== feedback.id))
    }, feedback.duration)

    return feedback.id
  }, [])

  const removeFeedback = useCallback((id: string) => {
    setFeedbacks(prev => prev.filter(f => f.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setFeedbacks([])
  }, [])

  return {
    feedbacks,
    triggerFeedback,
    removeFeedback,
    clearAll
  }
}

function getDefaultColor(type: FeedbackInstance['type']): string {
  const colors = {
    click: '#00ffff',
    hover: '#ffffff',
    success: '#00ff88',
    error: '#ff4444',
    'audio-trigger': '#ff00ff'
  }
  return colors[type]
}

function getDefaultDuration(type: FeedbackInstance['type']): number {
  const durations = {
    click: 800,
    hover: 500,
    success: 1200,
    error: 1500,
    'audio-trigger': 1000
  }
  return durations[type]
}

// Haptic feedback for supported devices
export function useHapticFeedback() {
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [50]
      }
      navigator.vibrate(patterns[type])
    }
  }, [])

  return { triggerHaptic }
}