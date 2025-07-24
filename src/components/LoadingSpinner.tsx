'use client'
import React from 'react'

interface LoadingSpinnerProps {
  message?: string
  size?: 'small' | 'medium' | 'large'
  variant?: 'audio' | 'webgl' | 'general'
}

export function LoadingSpinner({ 
  message = 'Loading...', 
  size = 'medium',
  variant = 'general' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-12 h-12', 
    large: 'w-16 h-16'
  }

  const colorSchemes = {
    audio: 'from-purple-500 to-pink-500',
    webgl: 'from-cyan-500 to-blue-500',
    general: 'from-white/80 to-white/40'
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-6">
      {/* Animated Spinner */}
      <div className={`${sizeClasses[size]} relative`}>
        {/* Outer Ring */}
        <div 
          className={`absolute inset-0 rounded-full bg-gradient-to-r ${colorSchemes[variant]} animate-spin`}
          style={{
            background: `conic-gradient(from 0deg, transparent, currentColor, transparent)`,
            animation: 'spin 1s linear infinite'
          }}
        />
        {/* Inner Circle */}
        <div className="absolute inset-2 rounded-full bg-black/20 backdrop-blur-sm" />
        
        {/* Pulsing Center Dot */}
        <div className={`absolute inset-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r ${colorSchemes[variant]} animate-pulse`} />
      </div>

      {/* Loading Message */}
      <div className="text-center">
        <p className="text-white font-medium text-sm md:text-base">
          {message}
        </p>
        
        {/* Animated Dots */}
        <div className="flex justify-center space-x-1 mt-2">
          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}

// Skeleton components for different content types
export function CanvasSkeleton() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-black">
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      />
      
      {/* Animated Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute w-32 h-32 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 animate-pulse"
            style={{
              left: `${20 + i * 30}%`,
              top: `${30 + i * 20}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: '3s'
            }}
          />
        ))}
      </div>

      {/* Loading Message */}
      <div className="absolute inset-0 flex items-center justify-center">
        <LoadingSpinner 
          message="Initializing 3D Engine..." 
          size="large" 
          variant="webgl" 
        />
      </div>
    </div>
  )
}

export function UISkeleton() {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-4">
      {/* Bottom Drawer Skeleton */}
      <div className="bg-black/20 backdrop-blur-xl border border-white/20 rounded-xl p-4 animate-pulse">
        <div className="flex justify-between items-center mb-4">
          <div className="w-24 h-6 bg-white/20 rounded" />
          <div className="w-16 h-8 bg-white/20 rounded-full" />
        </div>
        
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-white/10 rounded-lg" />
          ))}
        </div>
        
        <div className="space-y-2">
          <div className="w-full h-4 bg-white/10 rounded" />
          <div className="w-3/4 h-4 bg-white/10 rounded" />
        </div>
      </div>
    </div>
  )
}

export default LoadingSpinner