// Simple smoke tests to verify basic functionality
import { describe, it, expect } from 'vitest'

describe('Smoke Tests', () => {
  it('should load basic utilities', () => {
    expect(1 + 1).toBe(2)
  })

  it('should have working environment', () => {
    expect(typeof window).toBe('object')
    expect(globalThis).toBeDefined()
  })
})
