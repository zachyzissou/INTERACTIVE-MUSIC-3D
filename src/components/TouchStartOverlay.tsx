'use client'
import React, { useState, useEffect } from 'react'
import { gsap } from 'gsap'

interface TouchStartOverlayProps {
  onStart: () => void
  onAudioPermission?: () => void
}

export default function TouchStartOverlay({ 
  onStart, 
  onAudioPermission 
}: TouchStartOverlayProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [audioPermissionGranted, setAudioPermissionGranted] = useState(false)
  
  useEffect(() => {
    // Animate overlay entrance
    gsap.fromTo('.touch-overlay', 
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.7)' }
    )
    
    // Animate pulsing effect
    gsap.to('.pulse-ring', {
      scale: 1.2,
      opacity: 0,
      duration: 2,
      repeat: -1,
      ease: 'power2.out'
    })
  }, [])

  const handleStart = async () => {
    setIsLoading(true)
    
    try {
      // Request audio permission if needed
      if (!audioPermissionGranted && onAudioPermission) {
        await onAudioPermission()
        setAudioPermissionGranted(true)
      }
      
      // Animate exit
      await gsap.to('.touch-overlay', {
        scale: 0.8,
        opacity: 0,
        duration: 0.4,
        ease: 'power2.in'
      })
      
      setIsVisible(false)
      onStart()
      
    } catch (error) {
      console.error('Failed to start audio:', error)
      setIsLoading(false)
    }
  }

  if (!isVisible) return null

  return (
    <div className="touch-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="relative flex flex-col items-center space-y-8 p-8 text-center">
        
        {/* Animated logo/icon */}
        <div className="relative">
          <div className="pulse-ring absolute inset-0 rounded-full border-2 border-cyan-400/50"></div>
          <div className="pulse-ring absolute inset-0 rounded-full border-2 border-pink-400/50" style={{ animationDelay: '0.5s' }}></div>
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl">
            <svg 
              className="w-12 h-12 text-white" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" 
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Oscillo
        </h1>
        
        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-white/80 max-w-md">
          Interactive 3D Music Experience
        </p>
        
        {/* Description */}
        <p className="text-sm md:text-base text-white/60 max-w-lg">
          Create music by interacting with 3D shapes. Experience audio-reactive visuals, 
          AI-powered composition, and immersive WebGPU shaders.
        </p>
        
        {/* Features list */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-white/70">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
            <span>3D Audio Reactive</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-purple-400"></div>
            <span>AI Music Generation</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-pink-400"></div>
            <span>WebGPU Shaders</span>
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={isLoading}
          className="relative group px-8 py-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-xl font-semibold text-white shadow-2xl transform transition-all duration-200 hover:scale-105 hover:shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Starting...</span>
            </div>
          ) : (
            <span className="flex items-center space-x-2">
              <span>Touch to Start</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          )}
          
          {/* Animated background */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10"></div>
        </button>
        
        {/* Audio permission notice */}
        <p className="text-xs text-white/50 max-w-sm">
          This experience requires audio access for the best interactive features. 
          Your audio will not be recorded or transmitted.
        </p>
      </div>
      
      {/* Background particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animation: 'float 6s ease-in-out infinite'
            }}
          />
        ))}
      </div>
      
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
      `}</style>
    </div>
  )
}