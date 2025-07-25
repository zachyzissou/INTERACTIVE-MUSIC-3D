'use client'
import React, { useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useArtisticExporter } from '../lib/artisticExport'
import { useArtisticTheme } from '../store/useArtisticTheme'
import { useMusicalPalette } from '../store/useMusicalPalette'
import { create } from 'zustand'

// Store for Canvas references
interface ExportReferencesStore {
  gl: any
  scene: any
  camera: any
  setReferences: (gl: any, scene: any, camera: any) => void
}

const useExportReferences = create<ExportReferencesStore>((set) => ({
  gl: null,
  scene: null,
  camera: null,
  setReferences: (gl, scene, camera) => set({ gl, scene, camera })
}))

// Component that runs inside Canvas to capture references
export function ExportMonitor() {
  const { setReferences } = useExportReferences()
  
  useFrame(({ gl, scene, camera }) => {
    setReferences(gl, scene, camera)
  })
  
  return null // This component doesn't render anything
}

// Export panel component
export default function ArtisticExportPanel({
  isVisible,
  onClose
}: {
  isVisible: boolean
  onClose: () => void
}) {
  const { gl, scene, camera } = useExportReferences()
  const { exporter, captureScreenshot, exportGLTF, generateShareLink } = useArtisticExporter()
  const { getCurrentConfig, currentTheme } = useArtisticTheme()
  const { key, scale, tempo, scaleNotes } = useMusicalPalette()
  
  const [isExporting, setIsExporting] = useState(false)
  const [exportStatus, setExportStatus] = useState<string>('')
  const [lastExportUrl, setLastExportUrl] = useState<string>('')

  // Update exporter references
  React.useEffect(() => {
    if (gl && scene && camera) {
      exporter.updateReferences(gl, scene, camera)
    }
  }, [gl, scene, camera, exporter])

  const handleScreenshotCapture = async (filter: 'none' | 'vintage' | 'cyberpunk' | 'ethereal' = 'none') => {
    setIsExporting(true)
    setExportStatus('Capturing screenshot...')
    
    try {
      const blob = await captureScreenshot({
        width: 1920,
        height: 1080,
        format: 'png',
        applyFilter: filter
      })
      
      if (blob) {
        const url = URL.createObjectURL(blob)
        setLastExportUrl(url)
        
        // Trigger download
        const a = document.createElement('a')
        a.href = url
        a.download = `sonic-canvas-${filter}-${Date.now()}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        
        setExportStatus('Screenshot saved!')
        setTimeout(() => setExportStatus(''), 3000)
      }
    } catch (error) {
      console.error('Screenshot capture failed:', error)
      setExportStatus('Screenshot failed!')
      setTimeout(() => setExportStatus(''), 3000)
    } finally {
      setIsExporting(false)
    }
  }

  const handleGLTFExport = async () => {
    setIsExporting(true)
    setExportStatus('Exporting 3D scene...')
    
    try {
      const audioMetadata = {
        key,
        scale,
        tempo,
        notes: scaleNotes,
        theme: currentTheme
      }
      
      const result = await exportGLTF({
        includeAudio: true,
        audioMetadata,
        binary: true
      })
      
      if (result instanceof Blob) {
        const url = URL.createObjectURL(result)
        setLastExportUrl(url)
        
        // Trigger download
        const a = document.createElement('a')
        a.href = url
        a.download = `sonic-canvas-scene-${Date.now()}.glb`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        
        setExportStatus('3D scene exported!')
        setTimeout(() => setExportStatus(''), 3000)
      }
    } catch (error) {
      console.error('GLTF export failed:', error)
      setExportStatus('Export failed!')
      setTimeout(() => setExportStatus(''), 3000)
    } finally {
      setIsExporting(false)
    }
  }

  const handleShareLink = () => {
    const themeConfig = getCurrentConfig()
    const sceneState = {
      theme: currentTheme,
      key,
      scale,
      tempo,
      customParams: themeConfig.shaderParams
    }
    
    const shareUrl = generateShareLink(sceneState)
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
      setExportStatus('Share link copied!')
      setTimeout(() => setExportStatus(''), 3000)
    }).catch(() => {
      setExportStatus('Failed to copy link')
      setTimeout(() => setExportStatus(''), 3000)
    })
  }

  if (!isVisible) return null

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'rgba(15, 15, 35, 0.95)',
      backdropFilter: 'blur(30px)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
      padding: '24px',
      color: 'white',
      fontFamily: 'system-ui, sans-serif',
      zIndex: 3000,
      minWidth: '400px',
      maxWidth: '90vw'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div>
          <h2 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '300',
            background: 'linear-gradient(135deg, #4ade80, #3b82f6, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            📱 Export & Share
          </h2>
          <p style={{
            margin: '4px 0 0 0',
            fontSize: '12px',
            opacity: 0.7
          }}>
            Capture and share your artistic musical creations
          </p>
        </div>
        
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            padding: '8px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '16px',
            lineHeight: 1
          }}
        >
          ✕
        </button>
      </div>

      {/* Export Status */}
      {exportStatus && (
        <div style={{
          marginBottom: '16px',
          padding: '12px',
          background: exportStatus.includes('failed') || exportStatus.includes('Failed')
            ? 'rgba(239, 68, 68, 0.2)'
            : 'rgba(34, 197, 94, 0.2)',
          border: `1px solid ${exportStatus.includes('failed') || exportStatus.includes('Failed')
            ? 'rgba(239, 68, 68, 0.3)'
            : 'rgba(34, 197, 94, 0.3)'}`,
          borderRadius: '8px',
          fontSize: '12px',
          textAlign: 'center'
        }}>
          {isExporting && '⏳ '}{exportStatus}
        </div>
      )}

      {/* Screenshot Section */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{
          margin: '0 0 12px 0',
          fontSize: '16px',
          fontWeight: '500',
          color: '#4ade80'
        }}>
          📸 High-Resolution Screenshots
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px'
        }}>
          {[
            { label: 'Original', filter: 'none' as const },
            { label: 'Vintage', filter: 'vintage' as const },
            { label: 'Cyberpunk', filter: 'cyberpunk' as const },
            { label: 'Ethereal', filter: 'ethereal' as const }
          ].map(({ label, filter }) => (
            <button
              key={filter}
              onClick={() => handleScreenshotCapture(filter)}
              disabled={isExporting}
              style={{
                padding: '12px',
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '12px',
                cursor: isExporting ? 'not-allowed' : 'pointer',
                opacity: isExporting ? 0.5 : 1,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!isExporting) {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isExporting) {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'
                }
              }}
            >
              {label}
            </button>
          ))}
        </div>
        
        <div style={{
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.6)',
          marginTop: '8px'
        }}>
          📏 Exports as 1920×1080 PNG images
        </div>
      </div>

      {/* 3D Export Section */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{
          margin: '0 0 12px 0',
          fontSize: '16px',
          fontWeight: '500',
          color: '#3b82f6'
        }}>
          🎨 3D Scene Export
        </h3>
        
        <button
          onClick={handleGLTFExport}
          disabled={isExporting}
          style={{
            width: '100%',
            padding: '12px',
            background: 'rgba(139, 92, 246, 0.2)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '12px',
            cursor: isExporting ? 'not-allowed' : 'pointer',
            opacity: isExporting ? 0.5 : 1,
            transition: 'all 0.2s ease',
            marginBottom: '8px'
          }}
          onMouseEnter={(e) => {
            if (!isExporting) {
              e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isExporting) {
              e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)'
            }
          }}
        >
          🎯 Export as GLB (3D Model)
        </button>
        
        <div style={{
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          📦 Includes geometry, materials, and audio metadata
        </div>
      </div>

      {/* Share Section */}
      <div>
        <h3 style={{
          margin: '0 0 12px 0',
          fontSize: '16px',
          fontWeight: '500',
          color: '#10b981'
        }}>
          🔗 Share Your Creation
        </h3>
        
        <button
          onClick={handleShareLink}
          style={{
            width: '100%',
            padding: '12px',
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            marginBottom: '8px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'
          }}
        >
          📋 Copy Shareable Link
        </button>
        
        <div style={{
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          🌐 Preserves theme, musical settings, and customizations
        </div>
      </div>

      {/* Preview of last export */}
      {lastExportUrl && (
        <div style={{
          marginTop: '16px',
          padding: '8px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '8px',
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.8)'
        }}>
          ✅ Last export ready for download
        </div>
      )}
    </div>
  )
}