'use client'
import React, { ErrorInfo, ReactNode } from 'react'
import ui from '../styles/ui.module.css'
import { safeStringify } from '../lib/safeStringify'

interface Props {
  children: ReactNode
}
interface State {
  hasError: boolean
  cyclic?: boolean
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
    console.error('ErrorBoundary caught:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={ui.glass} style={{ padding: '1rem', color: 'red' }}>
          {this.state.cyclic
            ? 'Data serialization error—please reload.'
            : 'Something went wrong.'}
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
