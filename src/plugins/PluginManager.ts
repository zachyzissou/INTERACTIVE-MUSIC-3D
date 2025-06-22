export interface PluginContext {}

export interface Plugin {
  name: string
  init: (context: PluginContext) => void
}

import { safeStringify } from '../lib/safeStringify'

class PluginManager {
  private plugins: Plugin[] = []
  registerPlugin(plugin: Plugin) {
    this.plugins.push(plugin)
    plugin.init({})
    console.log(`Plugin loaded: ${safeStringify(plugin)}`)
  }
}

const pluginManager = new PluginManager()
export default pluginManager
