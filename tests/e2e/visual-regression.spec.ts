import { test, expect } from '@playwright/test'

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('[data-testid="start-overlay"]', { timeout: 10000 })
  })

  test('start overlay visual regression', async ({ page }) => {
    await expect(page).toHaveScreenshot('start-overlay.png', {
      fullPage: true,
      threshold: 0.3
    })
  })

  test('main experience visual regression', async ({ page }) => {
    await page.click('[data-testid="start-button"]')
    await page.waitForTimeout(3000) // Let animations settle
    
    await expect(page).toHaveScreenshot('main-experience.png', {
      fullPage: true,
      threshold: 0.3
    })
  })

  test('mobile layout visual regression', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.click('[data-testid="start-button"]')
    await page.waitForTimeout(2000)
    
    await expect(page).toHaveScreenshot('mobile-layout.png', {
      fullPage: true,
      threshold: 0.3
    })
  })

  test('tablet layout visual regression', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    
    await page.click('[data-testid="start-button"]')
    await page.waitForTimeout(2000)
    
    await expect(page).toHaveScreenshot('tablet-layout.png', {
      fullPage: true,
      threshold: 0.3
    })
  })

  test('high performance mode visual', async ({ page }) => {
    await page.click('[data-testid="start-button"]')
    
    // Enable high performance if settings are available
    await page.evaluate(() => {
      const perfStore = (window as any).__PERFORMANCE_STORE__
      if (perfStore) {
        perfStore.setLevel('high')
      }
    })
    
    await page.waitForTimeout(2000)
    
    await expect(page).toHaveScreenshot('high-performance.png', {
      fullPage: true,
      threshold: 0.3
    })
  })

  test('low performance mode visual', async ({ page }) => {
    await page.click('[data-testid="start-button"]')
    
    // Enable low performance
    await page.evaluate(() => {
      const perfStore = (window as any).__PERFORMANCE_STORE__
      if (perfStore) {
        perfStore.setLevel('low')
      }
    })
    
    await page.waitForTimeout(2000)
    
    await expect(page).toHaveScreenshot('low-performance.png', {
      fullPage: true,
      threshold: 0.3
    })
  })

  test('dark theme visual', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    
    await page.click('[data-testid="start-button"]')
    await page.waitForTimeout(2000)
    
    await expect(page).toHaveScreenshot('dark-theme.png', {
      fullPage: true,
      threshold: 0.3
    })
  })

  test('audio controls panel visual', async ({ page }) => {
    await page.click('[data-testid="start-button"]')
    
    // Open audio controls if they exist
    const audioButton = page.locator('[data-testid="audio-button"]')
    if (await audioButton.isVisible()) {
      await audioButton.click()
      await page.waitForTimeout(1000)
    }
    
    await expect(page).toHaveScreenshot('audio-controls.png', {
      fullPage: true,
      threshold: 0.3
    })
  })

  test('effects panel visual', async ({ page }) => {
    await page.click('[data-testid="start-button"]')
    
    // Open effects panel if it exists
    const effectsButton = page.locator('[data-testid="effects-button"]')
    if (await effectsButton.isVisible()) {
      await effectsButton.click()
      await page.waitForTimeout(1000)
    }
    
    await expect(page).toHaveScreenshot('effects-panel.png', {
      fullPage: true,
      threshold: 0.3
    })
  })

  test('error state visual', async ({ page }) => {
    // Force an error by blocking WebGL
    await page.addInitScript(() => {
      Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
        value: () => null
      })
    })
    
    await page.click('[data-testid="start-button"]')
    await page.waitForTimeout(2000)
    
    await expect(page).toHaveScreenshot('error-state.png', {
      fullPage: true,
      threshold: 0.3
    })
  })

  test('loading state visual', async ({ page }) => {
    // Slow down network to catch loading state
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 1000)
    })
    
    await page.click('[data-testid="start-button"]')
    await page.waitForTimeout(500)
    
    await expect(page).toHaveScreenshot('loading-state.png', {
      fullPage: true,
      threshold: 0.3
    })
  })
})
