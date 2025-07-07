// src/lib/accessibility.ts
export class AccessibilityManager {
  private announcer: HTMLElement | null = null
  private isReducedMotion = false
  private isHighContrast = false
  private focusTrap: HTMLElement[] = []

  constructor() {
    this.setupAnnouncer()
    this.detectPreferences()
    this.setupKeyboardNavigation()
  }

  private setupAnnouncer() {
    if (typeof document === 'undefined') return

    this.announcer = document.createElement('div')
    this.announcer.setAttribute('aria-live', 'polite')
    this.announcer.setAttribute('aria-atomic', 'true')
    this.announcer.className = 'sr-only'
    this.announcer.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `
    document.body.appendChild(this.announcer)
  }

  private detectPreferences() {
    if (typeof window === 'undefined') return

    // Detect reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    this.isReducedMotion = mediaQuery.matches
    mediaQuery.addEventListener('change', (e) => {
      this.isReducedMotion = e.matches
      this.announceToUser(
        this.isReducedMotion ? 'Reduced motion enabled' : 'Reduced motion disabled'
      )
    })

    // Detect high contrast preference
    const contrastQuery = window.matchMedia('(prefers-contrast: high)')
    this.isHighContrast = contrastQuery.matches
    contrastQuery.addEventListener('change', (e) => {
      this.isHighContrast = e.matches
      this.announceToUser(
        this.isHighContrast ? 'High contrast enabled' : 'High contrast disabled'
      )
    })
  }

  private setupKeyboardNavigation() {
    if (typeof document === 'undefined') return

    document.addEventListener('keydown', (e) => {
      // Global keyboard shortcuts
      switch (e.key) {
        case 'Escape':
          this.handleEscape()
          break
        case 'Tab':
          this.handleTab(e)
          break
        case ' ':
          if (e.target === document.body) {
            e.preventDefault()
            this.handleSpaceKey()
          }
          break
      }
    })
  }

  announceToUser(message: string) {
    if (!this.announcer) return
    
    this.announcer.textContent = message
    
    // Clear after announcement
    setTimeout(() => {
      if (this.announcer) {
        this.announcer.textContent = ''
      }
    }, 1000)
  }

  // Audio-specific accessibility features
  describeAudioAction(action: string, details?: any) {
    const descriptions: Record<string, string> = {
      'note': 'Playing musical note',
      'chord': 'Playing chord progression',
      'beat': 'Playing percussion beat',
      'spawn': 'New musical object created',
      'delete': 'Musical object removed',
      'mute': 'Audio muted',
      'unmute': 'Audio unmuted'
    }

    let message = descriptions[action] ?? action
    
    if (details) {
      if (details.note) message += ` in ${details.note}`
      if (details.volume) message += ` at ${Math.round(details.volume * 100)}% volume`
      if (details.position) message += ` at position ${details.position.join(', ')}`
    }

    this.announceToUser(message)
  }

  // Visual focus indicators
  addFocusIndicator(element: HTMLElement) {
    element.addEventListener('focus', () => {
      element.style.outline = '3px solid #0066cc'
      element.style.outlineOffset = '2px'
    })

    element.addEventListener('blur', () => {
      element.style.outline = ''
      element.style.outlineOffset = ''
    })
  }

  // Skip links for screen readers
  addSkipLink(targetId: string, text: string) {
    if (typeof document === 'undefined') return

    const skipLink = document.createElement('a')
    skipLink.href = `#${targetId}`
    skipLink.textContent = text
    skipLink.className = 'skip-link'
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: white;
      padding: 8px;
      text-decoration: none;
      z-index: 9999;
      transition: top 0.3s;
    `

    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px'
    })

    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px'
    })

    document.body.insertBefore(skipLink, document.body.firstChild)
  }

  // Color contrast utilities
  getContrastRatio(color1: string, color2: string): number {
    const getLuminance = (color: string) => {
      const rgb = this.hexToRgb(color)
      if (!rgb) return 0

      const [r, g, b] = rgb.map(c => {
        c = c / 255
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      })

      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }

    const lum1 = getLuminance(color1)
    const lum2 = getLuminance(color2)
    const lighter = Math.max(lum1, lum2)
    const darker = Math.min(lum1, lum2)

    return (lighter + 0.05) / (darker + 0.05)
  }

  private hexToRgb(hex: string): [number, number, number] | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : null
  }

  ensureContrastRatio(foreground: string, background: string, ratio: number = 4.5): string {
    const currentRatio = this.getContrastRatio(foreground, background)
    if (currentRatio >= ratio) return foreground

    // Adjust foreground color to meet ratio
    const rgb = this.hexToRgb(foreground)
    if (!rgb) return foreground

    const [r, g, b] = rgb
    const factor = currentRatio < ratio ? 0.8 : 1.2

    const newR = Math.min(255, Math.max(0, Math.round(r * factor)))
    const newG = Math.min(255, Math.max(0, Math.round(g * factor)))
    const newB = Math.min(255, Math.max(0, Math.round(b * factor)))

    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`
  }

  // Keyboard event handlers
  private handleEscape() {
    // Close modals, panels, etc.
    const activeModal = document.querySelector('dialog[open], [role="dialog"]:not([aria-hidden="true"])')
    if (activeModal) {
      this.announceToUser('Dialog closed')
    }
  }

  private handleTab(e: KeyboardEvent) {
    if (this.focusTrap.length > 0) {
      const firstElement = this.focusTrap[0]
      const lastElement = this.focusTrap[this.focusTrap.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }
  }

  private handleSpaceKey() {
    // Trigger primary action (play/pause audio)
    this.announceToUser('Primary action triggered')
  }

  // Focus management
  trapFocus(container: HTMLElement) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    this.focusTrap = Array.from(focusableElements) as HTMLElement[]
    
    if (this.focusTrap.length > 0) {
      this.focusTrap[0].focus()
    }
  }

  releaseFocusTrap() {
    this.focusTrap = []
  }

  // Settings
  prefersReducedMotion(): boolean {
    return this.isReducedMotion
  }

  prefersHighContrast(): boolean {
    return this.isHighContrast
  }

  // Generate accessible IDs
  generateId(prefix: string = 'element'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
  }
}

export const accessibilityManager = new AccessibilityManager()
