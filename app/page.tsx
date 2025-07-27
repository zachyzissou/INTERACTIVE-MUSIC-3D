"use client"
import React from "react"
import dynamic from 'next/dynamic'
import ModernStartOverlay from '../src/components/ui/ModernStartOverlay'

const CanvasScene = dynamic(() => import('../src/components/CanvasScene'), { ssr: false })


export default function Home() {
  return (
    <div
      id="main-content"
      data-testid="main-content"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#0f0f23'
      }}
    >
      <CanvasScene />
      <ModernStartOverlay />
    </div>
  )
}