// app/layout.tsx
import '../src/styles/globals.css'
import React from 'react'

export const metadata = {
  title: 'Interactive Music 3D',
  description: 'Fluid physics-based 3D music creation experience',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
