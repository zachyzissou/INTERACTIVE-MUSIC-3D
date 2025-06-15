// app/layout.tsx
import '../src/styles/globals.css'
import ui from '../src/styles/ui.module.css'
import React from 'react'
import AudioSettingsPanel from '@/components/AudioSettingsPanel'

export const metadata = {
  title: 'Interactive Music 3D',
  description: 'Fluid physics-based 3D music creation experience',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={ui.root}>
        <AudioSettingsPanel />
        {children}
      </body>
    </html>
  )
}
