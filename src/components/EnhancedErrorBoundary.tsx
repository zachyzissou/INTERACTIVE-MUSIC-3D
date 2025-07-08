'use client'
import React, { ErrorInfo, ReactNode } from 'react'
import ui from '../styles/ui.module.css'
import { safeStringify } from '../lib/safeStringify'
import { logger } from '../lib/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  verbose?: boolean
  context?: string
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  errorId?: string
}

class EnhancedErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = Date.now().toString(36)
    return { 
      hasError: true, 
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorData = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context: this.props.context ?? 'Unknown',
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    // Log to console and external service
    console.error('ErrorBoundary caught:', safeStringify(errorData))
    logger.error(`Component error boundary triggered in ${errorData.context}: ${safeStringify(errorData)}`)

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // Send to monitoring service (implement based on your needs)
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // Example: Sentry, LogRocket, etc.
      // Sentry.captureException(error, { extra: errorData })
    }

    this.setState({ error, errorInfo })
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const isDev = process.env.NODE_ENV !== 'production'
      const showDetails = isDev || this.props.verbose

      return (
        <div 
          className={`${ui.glass} min-h-[200px] flex flex-col items-center justify-center p-6 m-4 text-center animate-fade-in`}
        >
          <div className="text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2">
            Something went wrong
          </h2>
          
          <p className="text-gray-300 mb-4 max-w-md">
            We encountered an unexpected error. This has been logged and will be investigated.
          </p>

          {this.state.errorId && (
            <p className="text-xs text-gray-400 mb-4">
              Error ID: {this.state.errorId}
            </p>
          )}

          <button
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
            onClick={this.retry}
          >
            Try Again
          </button>

          {showDetails && this.state.error && (
            <details 
              className="mt-6 max-w-full"
            >
              <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
                Show Error Details
              </summary>
              <pre className="mt-2 p-3 bg-black bg-opacity-50 rounded text-xs text-left overflow-auto max-h-40 max-w-full">
                <code className="text-red-300">
                  {this.state.error.name}: {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      {'\n\nComponent Stack:'}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </code>
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

export default EnhancedErrorBoundary
