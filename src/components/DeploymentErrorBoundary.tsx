'use client'
import React, { Component, ReactNode } from 'react'
import { logger } from '@/lib/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  context?: string
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  retryCount: number
  isRetrying: boolean
}

class DeploymentErrorBoundary extends Component<Props, State> {
  private retryTimeouts: NodeJS.Timeout[] = []
  private maxRetries = 3
  private retryDelay = 1000

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { context = 'DeploymentErrorBoundary', onError } = this.props
    
    // Log error details
    logger.error(`Error caught in ${context}:`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount
    })

    this.setState({
      error,
      errorInfo
    })

    // Call custom error handler if provided
    onError?.(error, errorInfo)

    // Auto-retry for certain types of errors
    this.attemptAutoRetry(error)
  }

  componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout))
  }

  private attemptAutoRetry = (error: Error) => {
    const { retryCount } = this.state
    
    // Only auto-retry for certain error types and within limit
    const shouldAutoRetry = (
      retryCount < this.maxRetries &&
      (
        error.message.includes('ChunkLoadError') ||
        error.message.includes('Loading chunk') ||
        error.message.includes('NetworkError') ||
        error.message.includes('WebGL') ||
        error.message.includes('THREE')
      )
    )

    if (shouldAutoRetry) {
      const delay = this.retryDelay * Math.pow(2, retryCount) // Exponential backoff
      
      const timeoutId = setTimeout(() => {
        this.handleRetry(true)
      }, delay)
      
      this.retryTimeouts.push(timeoutId)
    }
  }

  private handleRetry = (isAutoRetry = false) => {
    const { retryCount } = this.state
    
    if (retryCount >= this.maxRetries && !isAutoRetry) {
      // Force page reload if manual retry after max attempts
      window.location.reload()
      return
    }

    this.setState({
      isRetrying: true,
      retryCount: retryCount + 1
    })

    // Clear error state after a brief delay
    setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRetrying: false
      })
    }, 500)
  }

  private getErrorType = (error: Error): string => {
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      return 'Bundle Loading Error'
    }
    if (error.message.includes('WebGL')) {
      return 'WebGL Error'
    }
    if (error.message.includes('THREE')) {
      return '3D Rendering Error'
    }
    if (error.message.includes('Network')) {
      return 'Network Error'
    }
    return 'Application Error'
  }

  private getErrorSolution = (error: Error): string => {
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      return 'This usually happens after a deployment. The page will automatically refresh to load the latest version.'
    }
    if (error.message.includes('WebGL')) {
      return 'Please ensure your browser supports WebGL and hardware acceleration is enabled.'
    }
    if (error.message.includes('THREE')) {
      return 'There was an issue with 3D rendering. This might be related to your graphics hardware.'
    }
    if (error.message.includes('Network')) {
      return 'Please check your internet connection and try again.'
    }
    return 'An unexpected error occurred. The application will attempt to recover automatically.'
  }

  render() {
    const { hasError, error, isRetrying, retryCount } = this.state
    const { children, fallback, context = 'Application' } = this.props

    if (hasError && error) {
      // Show custom fallback if provided
      if (fallback) {
        return fallback
      }

      const errorType = this.getErrorType(error)
      const solution = this.getErrorSolution(error)
      const canRetry = retryCount < this.maxRetries

      return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="max-w-md w-full mx-4 bg-gradient-to-br from-red-900/20 to-black border border-red-500/30 rounded-xl p-6 text-center">
            {isRetrying ? (
              <>
                <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
                <h3 className="text-white text-lg font-semibold mb-2">
                  Recovering...
                </h3>
                <p className="text-white/70 text-sm">
                  Attempting to restore the application
                </p>
              </>
            ) : (
              <>
                {/* Error Icon */}
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>

                <h3 className="text-white text-xl font-bold mb-2">
                  {errorType}
                </h3>
                
                <p className="text-white/80 text-sm mb-4">
                  {solution}
                </p>

                {/* Error Details (Collapsible) */}
                <details className="mb-6 text-left">
                  <summary className="text-white/60 text-xs cursor-pointer hover:text-white/80 transition-colors">
                    Technical Details
                  </summary>
                  <div className="mt-2 p-3 bg-black/30 rounded border text-white/70 text-xs font-mono">
                    <div className="mb-2">
                      <strong>Context:</strong> {context}
                    </div>
                    <div className="mb-2">
                      <strong>Error:</strong> {error.message}
                    </div>
                    <div className="mb-2">
                      <strong>Attempts:</strong> {retryCount}/{this.maxRetries}
                    </div>
                    {error.stack && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="mt-1 text-xs overflow-auto max-h-20">
                          {error.stack.split('\n').slice(0, 3).join('\n')}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {canRetry ? (
                    <button
                      onClick={() => this.handleRetry()}
                      className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                    >
                      Retry ({this.maxRetries - retryCount} left)
                    </button>
                  ) : (
                    <button
                      onClick={() => window.location.reload()}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                    >
                      Reload Page
                    </button>
                  )}
                  
                  <button
                    onClick={() => window.location.href = '/'}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                  >
                    Go Home
                  </button>
                </div>

                {/* Auto-retry indicator */}
                {retryCount > 0 && canRetry && (
                  <p className="text-white/50 text-xs mt-3">
                    Auto-retry in progress...
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )
    }

    return children
  }
}

export default DeploymentErrorBoundary