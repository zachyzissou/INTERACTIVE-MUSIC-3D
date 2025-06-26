'use client'
import React, { ErrorInfo, ReactNode } from 'react'
import ui from '../styles/ui.module.css'
import { safeStringify } from '../lib/safeStringify'

interface Props {
  children: ReactNode
  verbose?: boolean
}
interface State {
  hasError: boolean
  cyclic?: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    const cyclic = error.message?.includes('cyclic object value')
    return { hasError: true, cyclic }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      'ErrorBoundary caught:',
      safeStringify({
        name: error.name,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      })
    )
    this.setState({ error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      const isDev = process.env.NODE_ENV !== 'production'
      return (
        <div className={ui.glass} style={{ padding: '1rem', color: 'red' }}>
          {this.state.cyclic
            ? 'Data serialization error—please reload.'
            : 'Something went wrong.'}
          {(isDev || this.props.verbose) && this.state.error && (
            <pre style={{ whiteSpace: 'pre-wrap' }}>
              {this.state.error.message}
              {'\n'}
              {this.state.error.stack}
              {'\n'}
              {this.state.errorInfo?.componentStack}
            </pre>
          )}
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
