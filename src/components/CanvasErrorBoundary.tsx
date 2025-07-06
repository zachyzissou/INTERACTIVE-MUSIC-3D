'use client'
import React from 'react'
import { logger } from '@/lib/logger'

interface CanvasErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface Props {
  children: React.ReactNode
}

export class CanvasErrorBoundary extends React.Component<Props, CanvasErrorBoundaryState> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): CanvasErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Canvas error: ' + error.message + ' Stack: ' + error.stack)
    logger.error('Component stack: ' + errorInfo.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
          <div className="text-center">
            <h2 className="text-2xl mb-4">3D Canvas Error</h2>
            <p className="mb-4">The 3D scene encountered an error and needs to be reloaded.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default CanvasErrorBoundary
