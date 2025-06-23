"use client";
// app/layout.tsx
import '../src/styles/globals.css'
import ui from '../src/styles/ui.module.css'
import React, { useEffect } from 'react'
import PluginLoader from "./PluginLoader"
import AudioSettingsPanel from '@/components/AudioSettingsPanel'
import ErrorBoundary from '@/components/ErrorBoundary'
import { assertPrimitives } from '@/lib/assertPrimitives'
import { safeStringify } from '@/lib/safeStringify'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
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
    <html lang="en">
      <body className={ui.root}>
        <ErrorBoundary>
          <AudioSettingsPanel />
          <PluginLoader />
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}
