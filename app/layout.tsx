"use client";
// app/layout.tsx
import '../src/styles/globals.css'
import ui from '../src/styles/ui.module.css'
import React, { useEffect } from 'react'
import { safeStringify } from '../src/lib/safeStringify'
import PluginLoader from "./PluginLoader"
import AudioSettingsPanel from '@/components/AudioSettingsPanel'
import ErrorBoundary from '@/components/ErrorBoundary'
import { assertPrimitives } from '@/lib/assertPrimitives'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const orig = console.error
    console.error = (...args: unknown[]) => {
      orig(
        ...args.map((a) =>
          typeof a === 'string' ? a : safeStringify(a)
        )
      )
    }
    window.onerror = (_msg, _src, lineno, colno, error) => {
      console.error('Global error:', {
        lineno,
        colno,
        stack: (error as Error | undefined)?.stack,
      })
    }
    window.addEventListener('unhandledrejection', (e) => {
      console.error('Unhandled rejection:', {
        stack: (e as PromiseRejectionEvent).reason?.stack,
      })
    })
    return () => {
      console.error = orig
    }
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
