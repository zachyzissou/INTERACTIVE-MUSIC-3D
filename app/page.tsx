"use client"
import React from "react"
import dynamic from 'next/dynamic'

const CanvasScene = dynamic(() => import('../src/components/CanvasScene'), { ssr: false })


export default function Home() {
  return (
    <div
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
    </div>
  )
}