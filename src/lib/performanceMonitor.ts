// src/lib/performance.ts
export class PerformanceMonitor {
  private readonly metrics: Map<string, number[]> = new Map()
  private readonly observers: Map<string, PerformanceObserver> = new Map()

  constructor() {
    this.initializeObservers()
  }

  private initializeObservers() {
    if (typeof window === 'undefined') return

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric('longTask', entry.duration)
            if (entry.duration > 50) {
              console.warn(`Long task detected: ${entry.duration}ms`)
            }
          }
        })
        longTaskObserver.observe({ entryTypes: ['longtask'] })
        this.observers.set('longTask', longTaskObserver)
      } catch (error) {
        console.warn('Failed to setup long task observer:', error)
      }

      // Monitor layout shifts
      try {
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric('cls', (entry as any).value)
          }
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
        this.observers.set('cls', clsObserver)
      } catch (error) {
        console.warn('Failed to setup CLS observer:', error)
      }
    }
  }

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    const values = this.metrics.get(name)!
    values.push(value)
    
    // Keep only last 100 values
    if (values.length > 100) {
      values.shift()
    }
  }

  getMetrics(name: string) {
    const values = this.metrics.get(name) ?? []
    if (values.length === 0) return null

    const sum = values.reduce((a, b) => a + b, 0)
    const avg = sum / values.length
    const max = Math.max(...values)
    const min = Math.min(...values)

    return { avg, max, min, count: values.length }
  }

  getAllMetrics() {
    const result: Record<string, any> = {}
    for (const [name] of Array.from(this.metrics)) {
      result[name] = this.getMetrics(name)
    }
    return result
  }

  measureFunction<T extends (...args: any[]) => any>(
    fn: T, 
    name?: string
  ): T {
    const metricName = name ?? fn.name ?? 'anonymousFunction'
    return ((...args: Parameters<T>) => {
      const start = performance.now()
      const result = fn(...args)
      
      if (result instanceof Promise) {
        return result.finally(() => {
          const duration = performance.now() - start
          this.recordMetric(metricName, duration)
        })
      } else {
        const duration = performance.now() - start
        this.recordMetric(metricName, duration)
        return result
      }
    }) as T
  }

  measureRender(componentName: string) {
    const start = performance.now()
    return () => {
      const duration = performance.now() - start
      this.recordMetric(`render_${componentName}`, duration)
    }
  }

  dispose() {
    for (const observer of Array.from(this.observers.values())) {
      observer.disconnect()
    }
    this.observers.clear()
    this.metrics.clear()
  }
}

// Memory monitoring utilities
export function getMemoryUsage() {
  if (typeof window === 'undefined' || !('performance' in window)) {
    return null
  }

  const memory = (performance as any).memory
  if (!memory) return null

  return {
    used: Math.round(memory.usedJSHeapSize / 1048576), // MB
    total: Math.round(memory.totalJSHeapSize / 1048576), // MB
    limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
  }
}

// Debounced resize handler
export function createResizeHandler(callback: () => void, delay = 100) {
  let timeoutId: NodeJS.Timeout
  
  return () => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(callback, delay)
  }
}

// FPS monitor
export class FPSMonitor {
  private lastTime = 0
  private frameCount = 0
  private fps = 0
  private readonly fpsArray: number[] = []

  update() {
    const now = performance.now()
    this.frameCount++
    
    if (now >= this.lastTime + 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastTime))
      this.fpsArray.push(this.fps)
      
      // Keep only last 30 seconds
      if (this.fpsArray.length > 30) {
        this.fpsArray.shift()
      }
      
      this.frameCount = 0
      this.lastTime = now
    }
  }

  getFPS() {
    return this.fps
  }

  getAverageFPS() {
    if (this.fpsArray.length === 0) return 0
    return Math.round(this.fpsArray.reduce((a, b) => a + b, 0) / this.fpsArray.length)
  }
}

export const performanceMonitor = new PerformanceMonitor()
export const fpsMonitor = new FPSMonitor()
