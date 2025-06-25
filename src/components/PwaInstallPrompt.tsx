'use client'
import { useEffect, useState } from 'react'

declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
  }
}

export default function PwaInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setPromptEvent(e)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler as any)
    return () => window.removeEventListener('beforeinstallprompt', handler as any)
  }, [])
  if (!visible || !promptEvent) return null
  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded pointer-events-auto">
      <button onClick={async () => { await promptEvent.prompt(); setVisible(false) }}>Add to Home Screen</button>
    </div>
  )
}
