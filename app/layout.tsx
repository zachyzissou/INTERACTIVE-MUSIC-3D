// app/layout.tsx
import '../src/styles/globals.css'
import React from 'react'
import AudioSettingsPanel from '@/components/AudioSettingsPanel'
import styles from '@/styles/audioSettingsPanel.module.css'

export const metadata = {
  title: 'Interactive Music 3D',
  description: 'Fluid physics-based 3D music creation experience',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className={styles.topBar}>
          <AudioSettingsPanel />
        </div>
        {children}
      </body>
    </html>
  )
}
