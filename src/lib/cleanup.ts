// src/lib/cleanup.ts
import { logger } from './logger'

interface CleanupResource {
  dispose: () => void
  name: string
}

class ResourceManager {
  private resources = new Set<CleanupResource>()
  
  register(resource: CleanupResource) {
    this.resources.add(resource)
    logger.debug(`Registered resource: ${resource.name}`)
  }
  
  unregister(resource: CleanupResource) {
    this.resources.delete(resource)
    logger.debug(`Unregistered resource: ${resource.name}`)
  }
  
  dispose(resource: CleanupResource) {
    try {
      resource.dispose()
      this.unregister(resource)
    } catch (error) {
      logger.error(`Failed to dispose resource ${resource.name}: ${String(error)}`)
    }
  }
  
  disposeAll() {
    const count = this.resources.size
    this.resources.forEach(resource => {
      try {
        resource.dispose()
      } catch (error) {
        logger.error(`Failed to dispose resource ${resource.name}: ${String(error)}`)
      }
    })
    this.resources.clear()
    logger.info(`Disposed ${count} resources`)
  }
  
  getResourceCount() {
    return this.resources.size
  }
}

export const resourceManager = new ResourceManager()

// Helper to wrap Three.js objects with cleanup
export function createManagedThreeObject<T extends { dispose(): void }>(
  createFn: () => T,
  name: string
): T {
  const object = createFn()
  resourceManager.register({
    dispose: () => object.dispose(),
    name: `Three.js ${name}`
  })
  return object
}

// Helper for audio nodes
export function createManagedAudioNode<T extends { dispose(): void }>(
  createFn: () => T,
  name: string
): T {
  const node = createFn()
  resourceManager.register({
    dispose: () => node.dispose(),
    name: `Audio ${name}`
  })
  return node
}

// Cleanup when window unloads
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    resourceManager.disposeAll()
  })
}
