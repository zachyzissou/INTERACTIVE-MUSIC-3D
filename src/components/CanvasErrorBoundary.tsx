'use client'
import React from 'react'
import { logger } from '@/lib/logger'

interface CanvasErrorBoundaryState {
  hasError: boolean
  error?: Error
  contextLost: boolean
  retryCount: number
}

interface Props {
  children: React.ReactNode
}

export class CanvasErrorBoundary extends React.Component<Props, CanvasErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null
  private readonly maxRetries = 3

  constructor(props: Props) {
    super(props)
    this.state = { 
      hasError: false, 
      contextLost: false, 
      retryCount: 0 
    }
  }

  static getDerivedStateFromError(error: Error): Partial<CanvasErrorBoundaryState> {
    const isWebGLError = error.message.includes('Context Lost') || 
                        error.message.includes('WebGL') ||
                        error.message.includes('webgl')
    
    return { 
      hasError: true, 
      error,
      contextLost: isWebGLError
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Canvas error: ' + error.message + ' Stack: ' + error.stack)
    logger.error('Component stack: ' + errorInfo.componentStack)

    // Attempt automatic recovery for WebGL context loss
    if (this.state.contextLost && this.state.retryCount < this.maxRetries) {
      this.scheduleRetry()
    }
  }

  scheduleRetry = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }

    this.retryTimeoutId = setTimeout(() => {
      this.handleRetry()
    }, 2000 * (this.state.retryCount + 1)) // Exponential backoff
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      contextLost: false,
      retryCount: prevState.retryCount + 1
    }))
  }

  handleManualRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      contextLost: false,
      retryCount: 0
    })
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/20 to-black/90 backdrop-blur-sm">
          <div className="bg-black/80 backdrop-blur border border-purple-500/30 rounded-xl p-6 max-w-md mx-4 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-white mb-3">
              {this.state.contextLost ? '3D Rendering Issue' : '3D Canvas Error'}
            </h2>
            <p className="text-purple-200 mb-4 text-sm">
              {this.state.contextLost 
                ? 'The 3D graphics context was lost. This can happen due to GPU driver issues or system resources.'
                : 'The 3D scene encountered an error and needs to be reloaded.'
              }
            </p>
            {this.state.retryCount < this.maxRetries && this.state.contextLost && (
              <p className="text-purple-300 mb-4 text-xs">
                Attempting automatic recovery... (Attempt {this.state.retryCount + 1}/{this.maxRetries})
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleManualRetry}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 text-sm"
              >
                Retry 3D
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-all duration-200 text-sm"
              >
                Reload Page
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-purple-300 cursor-pointer text-sm">
                  Error Details
                </summary>
                <pre className="text-xs text-red-300 bg-black/50 p-2 rounded mt-2 overflow-auto max-h-32">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default CanvasErrorBoundary
