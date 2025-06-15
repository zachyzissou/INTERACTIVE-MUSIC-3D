'use client'
import { useEffect } from 'react'
import pluginManager from '@/plugins/PluginManager'

export default function PluginLoader() {
  useEffect(() => {
    pluginManager.registerPlugin({
      name: 'Stub',
      init: () => {},
    })
  }, [])
  return null
}
