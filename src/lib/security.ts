// src/lib/security.ts
export class SecurityManager {
  private nonce: string | null = null

  constructor() {
    this.generateNonce()
    this.setupSecurityHeaders()
  }

  private generateNonce() {
    if (typeof window !== 'undefined') {
      // Generate a random nonce for CSP
      const array = new Uint8Array(16)
      crypto.getRandomValues(array)
      this.nonce = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
    }
  }

  private setupSecurityHeaders() {
    if (typeof document !== 'undefined') {
      // Add security meta tags if they don't exist
      this.addMetaTag('Content-Security-Policy', this.getCSPDirective())
      this.addMetaTag('X-Frame-Options', 'DENY')
      this.addMetaTag('X-Content-Type-Options', 'nosniff')
      this.addMetaTag('Referrer-Policy', 'strict-origin-when-cross-origin')
    }
  }

  private addMetaTag(name: string, content: string) {
    if (document.querySelector(`meta[http-equiv="${name}"]`)) return

    const meta = document.createElement('meta')
    meta.httpEquiv = name
    meta.content = content
    document.head.appendChild(meta)
  }

  private getCSPDirective(): string {
    const directives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob:",
      "connect-src 'self' ws: wss: https://api.github.com",
      "worker-src 'self' blob:",
      "child-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ]

    if (this.nonce) {
      directives[1] += ` 'nonce-${this.nonce}'`
    }

    return directives.join('; ')
  }

  // Sanitize user input
  sanitizeString(input: string): string {
    if (typeof input !== 'string') return ''
    
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
      .slice(0, 1000) // Limit length
  }

  // Validate URLs
  isValidURL(url: string): boolean {
    try {
      const parsed = new URL(url)
      return ['http:', 'https:', 'blob:', 'data:'].includes(parsed.protocol)
    } catch {
      return false
    }
  }

  // Rate limiting for functions
  createRateLimiter(maxCalls: number, windowMs: number) {
    const calls: number[] = []
    
    return function rateLimitedFunction<T extends (...args: any[]) => any>(fn: T): T {
      return ((...args: Parameters<T>) => {
        const now = Date.now()
        
        // Remove old calls outside the window
        while (calls.length > 0 && calls[0] <= now - windowMs) {
          calls.shift()
        }
        
        // Check if we've exceeded the limit
        if (calls.length >= maxCalls) {
          console.warn('Rate limit exceeded')
          return
        }
        
        calls.push(now)
        return fn(...args)
      }) as T
    }
  }

  // Input validation for audio parameters
  validateAudioParam(value: any, min: number, max: number): number {
    const num = parseFloat(value)
    if (isNaN(num)) return min
    return Math.max(min, Math.min(max, num))
  }

  // Validate and sanitize object data
  sanitizeObjectData(data: any): any {
    if (!data || typeof data !== 'object') return {}
    
    const sanitized: any = {}
    const allowedKeys = ['type', 'position', 'rotation', 'scale', 'color', 'name']
    
    for (const key of allowedKeys) {
      if (key in data) {
        switch (key) {
          case 'type':
            sanitized[key] = ['note', 'chord', 'beat'].includes(data[key]) ? data[key] : 'note'
            break
          case 'position':
          case 'rotation':
          case 'scale':
            if (Array.isArray(data[key]) && data[key].length === 3) {
              sanitized[key] = data[key].map((v: any) => this.validateAudioParam(v, -100, 100))
            }
            break
          case 'color':
            if (typeof data[key] === 'string' && /^#[0-9A-F]{6}$/i.test(data[key])) {
              sanitized[key] = data[key]
            }
            break
          case 'name':
            sanitized[key] = this.sanitizeString(data[key])
            break
        }
      }
    }
    
    return sanitized
  }

  // Monitor for suspicious activity
  setupSecurityMonitoring() {
    if (typeof window === 'undefined') return

    // Monitor for console manipulation
    const originalConsole = { ...console }
    Object.keys(console).forEach(key => {
      if (typeof (console as any)[key] === 'function') {
        (console as any)[key] = (...args: any[]) => {
          if (args.some(arg => typeof arg === 'string' && arg.includes('script'))) {
            console.warn('Suspicious console activity detected')
          }
          return (originalConsole as any)[key](...args)
        }
      }
    })

    // Monitor for excessive localStorage usage
    const originalSetItem = localStorage.setItem
    localStorage.setItem = function(key: string, value: string) {
      if (value.length > 1024 * 1024) { // 1MB limit
        console.warn('Large localStorage write detected:', key)
        return
      }
      return originalSetItem.call(this, key, value)
    }

    // Monitor WebGL context loss
    const canvas = document.querySelector('canvas')
    if (canvas) {
      canvas.addEventListener('webglcontextlost', (e) => {
        console.warn('WebGL context lost:', e)
        e.preventDefault()
      })
    }
  }

  getNonce(): string | null {
    return this.nonce
  }

  // Generate secure random values
  generateSecureRandom(length: number = 32): string {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(length)
      crypto.getRandomValues(array)
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
    }
    
    // Fallback for environments without crypto
    return Math.random().toString(36).substring(2, length + 2)
  }
}

export const securityManager = new SecurityManager()
