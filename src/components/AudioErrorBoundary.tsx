'use client'
import React from 'react'
import { logger } from '@/lib/logger'

interface AudioErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface Props {
  children: React.ReactNode
}

export class AudioErrorBoundary extends React.Component<Props, AudioErrorBoundaryState> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): AudioErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Audio error: ' + error.message + ' Stack: ' + error.stack)
    logger.error('Component stack: ' + errorInfo.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed bottom-0 left-0 right-0 bg-red-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Audio System Error</h3>
              <p className="text-sm">Audio functionality is temporarily unavailable.</p>
            </div>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="px-3 py-1 bg-red-700 hover:bg-red-800 rounded text-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default AudioErrorBoundary
