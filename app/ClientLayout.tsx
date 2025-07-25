'use client'
import React from 'react'

export default function ClientLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <div>
      {children}
    </div>
  )
}