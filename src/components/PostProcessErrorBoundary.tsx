// src/components/PostProcessErrorBoundary.tsx
'use client'
import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  isWebKitError: boolean
}

// Detect WebKit-specific errors that should fallback gracefully
function isWebKitCompatibilityError(error: Error): boolean {
  const message = error.message.toLowerCase()
  return (
    message.includes('circular structure') ||
    message.includes('webkit') ||
    message.includes('safari') ||
    message.includes('postprocessing') ||
    message.includes('serialization')
  )
}

export class PostProcessErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, isWebKitError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    const isWebKitError = isWebKitCompatibilityError(error)
    return { hasError: true, error, isWebKitError }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('Post-processing error caught:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      isWebKitError: this.state.isWebKitError
    })

    // For WebKit errors, we fail silently to maintain app stability
    if (this.state.isWebKitError) {
      console.warn('WebKit compatibility issue detected, disabling post-processing effects')
    }
  }

  render() {
    if (this.state.hasError) {
      // For WebKit errors, render nothing (graceful degradation)
      if (this.state.isWebKitError) {
        return null
      }
      
      // For other errors, show minimal fallback
      return this.props.fallback ?? (
        <mesh>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshBasicMaterial color="red" transparent opacity={0.1} />
        </mesh>
      )
    }

    return this.props.children
  }
}

export default PostProcessErrorBoundary
