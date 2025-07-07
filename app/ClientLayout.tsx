'use client'
import React, { useEffect } from 'react'
import { registerServiceWorker } from '@/lib/registerServiceWorker'
import { loadObjectsFromStorage } from '@/store/useObjects'
import PluginLoader from "./PluginLoader"
import AudioSettingsPanel from '@/components/AudioSettingsPanel'
import ErrorBoundary from '@/components/EnhancedErrorBoundary'
import { assertPrimitives } from '@/lib/assertPrimitives'
import { safeStringify } from '@/lib/safeStringify'
import { logger } from '@/lib/logger'

export default function ClientLayout({ children }: { readonly children: React.ReactNode }) {
  useEffect(() => {
    registerServiceWorker()
    loadObjectsFromStorage()
    if (process.env.NODE_ENV !== 'production') {
      logger.info('ClientLayout mounted')
    }
    window.onerror = (_msg, _src, lineno, colno, error) => {
      logger.error(
        'Global error: ' + safeStringify({
          lineno,
          colno,
          stack: error?.stack,
        })
      )
    }
    window.addEventListener('unhandledrejection', (e) => {
      logger.error(
        'Unhandled rejection: ' + safeStringify({
          stack: e.reason?.stack,
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