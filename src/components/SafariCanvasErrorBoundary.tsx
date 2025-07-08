'use client'
import React from 'react'

interface SafariCanvasErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface SafariCanvasErrorBoundaryState {
  hasError: boolean
  errorInfo?: Error
}

class SafariCanvasErrorBoundary extends React.Component<
  SafariCanvasErrorBoundaryProps,
  SafariCanvasErrorBoundaryState
> {
  constructor(props: SafariCanvasErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): SafariCanvasErrorBoundaryState {
    return {
      hasError: true,
      errorInfo: error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('Safari Canvas Error:', error, errorInfo)
    
    // Specific Safari WebGL handling
    if (typeof navigator !== 'undefined' && /safari/i.test(navigator.userAgent)) {
      console.warn('Safari WebGL compatibility issue detected, using fallback')
    }
  }

  render() {
    if (this.state.hasError) {
      // Safari-specific fallback
      return this.props.fallback || (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-blue-900/20 flex items-center justify-center text-white">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">🎵</div>
            <h2 className="text-2xl font-bold mb-2">Oscillo</h2>
            <p className="text-white/60 mb-4">3D scene loading...</p>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default SafariCanvasErrorBoundary
