"use client"
import React from "react"
import dynamic from 'next/dynamic'

const SimpleWorkingCanvas = dynamic(() => import('../src/components/SimpleWorkingCanvas'), { ssr: false })


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
      <SimpleWorkingCanvas />
    </div>
  )
}