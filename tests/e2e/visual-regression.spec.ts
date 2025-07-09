import { test, expect } from '@playwright/test'

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Disable animations for stable screenshots
    await page.addInitScript(() => {
      document.documentElement.style.setProperty('--animation-duration', '0s');
      document.documentElement.style.setProperty('--transition-duration', '0s');
    });
    
    // Ensure consistent viewport for all tests
    await page.setViewportSize({ width: 390, height: 664 });
    
    await page.goto('/')
    await page.waitForSelector('[data-testid="start-overlay"]', { timeout: 10000 })
  })

  test('start overlay visual regression', async ({ page }) => {
    await expect(page).toHaveScreenshot('start-overlay.png', {
      fullPage: true,
      threshold: 0.3,
      animations: 'disabled'
    })
  })

  test('main experience visual regression', async ({ page }) => {
    await page.click('[data-testid="start-button"]')
    await page.waitForTimeout(5000) // Let animations settle and content load
    
    // Wait for canvas or main content to be visible
    await page.waitForSelector('#main-content', { timeout: 10000 })
    
    await expect(page).toHaveScreenshot('main-experience.png', {
      fullPage: true,
      threshold: 0.3,
      animations: 'disabled'
    })
  })

  test('mobile layout visual regression', async ({ page }) => {
    await page.click('[data-testid="start-button"]')
    await page.waitForTimeout(3000)
    
    // Wait for main content
    await page.waitForSelector('#main-content', { timeout: 10000 })
    
    await expect(page).toHaveScreenshot('mobile-layout.png', {
      fullPage: true,
      threshold: 0.3,
      animations: 'disabled'
    })
  })

  test('tablet layout visual regression', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    
    await page.click('[data-testid="start-button"]')
    await page.waitForTimeout(3000)
    
    // Wait for main content
    await page.waitForSelector('#main-content', { timeout: 10000 })
    
    await expect(page).toHaveScreenshot('tablet-layout.png', {
      fullPage: true,
      threshold: 0.3,
      animations: 'disabled'
    })
  })

  test('high performance mode visual', async ({ page }) => {
    await page.click('[data-testid="start-button"]')
    
    // Wait for main content
    await page.waitForSelector('#main-content', { timeout: 10000 })
    
    // Enable high performance if settings are available
    await page.evaluate(() => {
      const perfStore = (window as any).__PERFORMANCE_STORE__
      if (perfStore) {
        perfStore.setLevel('high')
      }
    })
    
    await page.waitForTimeout(3000)
    
    await expect(page).toHaveScreenshot('high-performance.png', {
      fullPage: true,
      threshold: 0.3,
      animations: 'disabled'
    })
  })

  test('low performance mode visual', async ({ page }) => {
    await page.click('[data-testid="start-button"]')
    
    // Wait for main content
    await page.waitForSelector('#main-content', { timeout: 10000 })
    
    // Enable low performance
    await page.evaluate(() => {
      const perfStore = (window as any).__PERFORMANCE_STORE__
      if (perfStore) {
        perfStore.setLevel('low')
      }
    })
    
    await page.waitForTimeout(3000)
    
    await expect(page).toHaveScreenshot('low-performance.png', {
      fullPage: true,
      threshold: 0.3,
      animations: 'disabled'
    })
  })

  test('dark theme visual', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    
    await page.click('[data-testid="start-button"]')
    
    // Wait for main content
    await page.waitForSelector('#main-content', { timeout: 10000 })
    await page.waitForTimeout(3000)
    
    await expect(page).toHaveScreenshot('dark-theme.png', {
      fullPage: true,
      threshold: 0.3,
      animations: 'disabled'
    })
  })

  test('audio controls panel visual', async ({ page }) => {
    await page.click('[data-testid="start-button"]')
    
    // Wait for main content
    await page.waitForSelector('#main-content', { timeout: 10000 })
    
    // Open audio controls if they exist
    const audioButton = page.locator('[data-testid="audio-button"]')
    if (await audioButton.isVisible()) {
      await audioButton.click()
      await page.waitForTimeout(1000)
    }
    
    await page.waitForTimeout(2000)
    
    await expect(page).toHaveScreenshot('audio-controls.png', {
      fullPage: true,
      threshold: 0.3,
      animations: 'disabled'
    })
  })

  test('effects panel visual', async ({ page }) => {
    await page.click('[data-testid="start-button"]')
    
    // Wait for main content
    await page.waitForSelector('#main-content', { timeout: 10000 })
    
    // Open effects panel if it exists
    const effectsButton = page.locator('[data-testid="effects-button"]')
    if (await effectsButton.isVisible()) {
      await effectsButton.click()
      await page.waitForTimeout(1000)
    }
    
    await page.waitForTimeout(2000)
    
    await expect(page).toHaveScreenshot('effects-panel.png', {
      fullPage: true,
      threshold: 0.3,
      animations: 'disabled'
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
    
    // Wait for main content or error state
    await page.waitForTimeout(3000)
    
    await expect(page).toHaveScreenshot('error-state.png', {
      fullPage: true,
      threshold: 0.3,
      animations: 'disabled'
    })
  })

  test('loading state visual', async ({ page }) => {
    // Slow down network to catch loading state
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 1000)
    })
    
    await page.click('[data-testid="start-button"]')
    await page.waitForTimeout(1000)
    
    await expect(page).toHaveScreenshot('loading-state.png', {
      fullPage: true,
      threshold: 0.3,
      animations: 'disabled'
    })
  })
})
