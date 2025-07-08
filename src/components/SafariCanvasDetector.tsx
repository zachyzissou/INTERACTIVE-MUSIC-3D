'use client'
import React from 'react'
import * as THREE from 'three'

interface SafariCanvasDetectorProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

const SafariCanvasDetector: React.FC<SafariCanvasDetectorProps> = ({ children, fallback }) => {
  const [canRender3D, setCanRender3D] = React.useState<boolean | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const detectWebGLSupport = async () => {
      try {
        // Create a test canvas
        const testCanvas = document.createElement('canvas')
        testCanvas.width = 1
        testCanvas.height = 1
        
        // Try to get WebGL context
        const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl') as WebGLRenderingContext | null
        
        if (!gl) {
          setError('WebGL not supported')
          setCanRender3D(false)
          return
        }

        // Test basic WebGL functionality
        const vertexShader = gl.createShader(gl.VERTEX_SHADER)
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
        
        if (!vertexShader || !fragmentShader) {
          setError('WebGL shader creation failed')
          setCanRender3D(false)
          return
        }

        // Test Three.js initialization
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
        
        try {
          const renderer = new THREE.WebGLRenderer({ 
            canvas: testCanvas,
            antialias: false,
            alpha: true,
            preserveDrawingBuffer: true,
            failIfMajorPerformanceCaveat: false
          })
          
          // Test basic rendering
          const geometry = new THREE.BoxGeometry(1, 1, 1)
          const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
          const cube = new THREE.Mesh(geometry, material)
          scene.add(cube)
          
          camera.position.z = 5
          renderer.render(scene, camera)
          
          // Clean up
          renderer.dispose()
          geometry.dispose()
          material.dispose()
          
          setCanRender3D(true)
        } catch (renderError) {
          console.warn('Three.js rendering test failed:', renderError)
          setError('Three.js initialization failed')
          setCanRender3D(false)
        }
        
      } catch (detectionError) {
        console.warn('WebGL detection failed:', detectionError)
        setError('WebGL detection failed')
        setCanRender3D(false)
      }
    }

    // Add small delay to ensure DOM is ready
    const timer = setTimeout(detectWebGLSupport, 100)
    
    return () => clearTimeout(timer)
  }, [])

  // Show loading state while detecting
  if (canRender3D === null) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-blue-900/20 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-4xl mb-4">🎵</div>
          <p>Initializing 3D environment...</p>
        </div>
      </div>
    )
  }

  // Show fallback if 3D rendering not supported
  if (!canRender3D) {
    return fallback || (
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-blue-900/20 flex items-center justify-center text-white">
        <div className="text-center p-8 max-w-md">
          <div className="text-6xl mb-6">🎵</div>
          <h2 className="text-2xl font-bold mb-4">Oscillo</h2>
          <p className="text-white/80 mb-4">
            Your browser doesn&apos;t support 3D graphics (WebGL). 
            Oscillo works best with Chrome, Firefox, or Edge.
          </p>
          {error && (
            <p className="text-red-400 text-sm mb-4">
              Error: {error}
            </p>
          )}
          <div className="bg-black/30 rounded-lg p-4 border border-white/20">
            <p className="text-white/60 text-sm">
              🎹 Audio features still work!<br/>
              Use the bottom controls to make music.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Render 3D scene if supported
  return <>{children}</>
}

export default SafariCanvasDetector
