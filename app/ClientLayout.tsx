'use client'
import React, { useEffect } from 'react'
import { registerServiceWorker } from '@/lib/registerServiceWorker'
import { loadObjectsFromStorage } from '@/store/useObjects'
import PluginLoader from "./PluginLoader"
import AudioSettingsPanel from '@/components/AudioSettingsPanel'
import ErrorBoundary from '@/components/EnhancedErrorBoundary'
import { assertPrimitives } from '@/lib/assertPrimitives'
import { safeStringify } from '@/lib/safeStringify'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    registerServiceWorker()
    loadObjectsFromStorage()
    if (process.env.NODE_ENV !== 'production') {
      console.log('ClientLayout mounted')
    }
    window.onerror = (_msg, _src, lineno, colno, error) => {
      console.error(
        'Global error:',
        safeStringify({
          lineno,
          colno,
          stack: (error as Error | undefined)?.stack,
        })
      )
    }
    window.addEventListener('unhandledrejection', (e) => {
      console.error(
        'Unhandled rejection:',
        safeStringify({
          stack: (e as PromiseRejectionEvent).reason?.stack,
        })
      )
    })
  }, [])
  
  const pageProps = {}
  assertPrimitives(pageProps, 'pageProps')
  
  return (
    <ErrorBoundary context="ClientLayout" verbose>
      <AudioSettingsPanel />
      <PluginLoader />
      {children}
    </ErrorBoundary>
  )
}