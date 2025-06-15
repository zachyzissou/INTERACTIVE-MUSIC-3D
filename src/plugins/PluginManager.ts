export interface Plugin {
  name: string
  init: (context: any) => void
}

class PluginManager {
  private plugins: Plugin[] = []
  registerPlugin(plugin: Plugin) {
    this.plugins.push(plugin)
    plugin.init({})
    console.log(`Plugin ${plugin.name} loaded`)
  }
}

const pluginManager = new PluginManager()
export default pluginManager
