import { test, expect } from '@playwright/test'

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock time for consistent rendering but preserve app functionality
    await page.addInitScript(() => {
      // Store original Math.random for selective use
      const originalRandom = Math.random;
      
      // Mock Math.random for visual consistency only after app starts
      let shouldMockRandom = false;
      (window as any).__enableRandomMock = () => { shouldMockRandom = true; };
      
      Math.random = () => shouldMockRandom ? 0.5 : originalRandom();
      
      // Fix date for consistency
      const mockDate = new Date('2025-01-01T00:00:00.000Z');
      Date.now = () => mockDate.getTime();
    });

    // Disable all animations and transitions for stable screenshots
    await page.addInitScript(() => {
      document.documentElement.style.setProperty('--animation-duration', '0s');
      document.documentElement.style.setProperty('--transition-duration', '0s');
    });

    // Add comprehensive animation disabling CSS
    await page.addStyleTag({ 
      content: `
        *, *::before, *::after {
          animation-delay: 0s !important;
          animation-duration: 0s !important;
          animation-play-state: paused !important;
          transition-delay: 0s !important;
          transition-duration: 0s !important;
          scroll-behavior: auto !important;
        }
      ` 
    });
    
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.waitForSelector('[data-testid="start-overlay"]', { timeout: 10000 })
    
    // Wait for fonts to load completely
    await page.evaluate(() => document.fonts.ready);
  })

  test('start overlay visual regression', async ({ page }) => {
    await expect(page).toHaveScreenshot('start-overlay.png', {
      fullPage: true,
      threshold: 0.3,
      animations: 'disabled'
    })
  })

  test('main experience visual regression', async ({ page }) => {
    // Click anywhere on the start overlay to proceed
    await page.click('[data-testid="start-overlay"]')
    
    // Wait for main content to be visible and fully loaded
    await page.waitForSelector('#main-content', { timeout: 15000 })
    
    // Enable random mocking for consistent visuals now that app is started
    await page.evaluate(() => (window as any).__enableRandomMock?.());
    
    // Wait for any async loading to complete
    await page.waitForLoadState('networkidle')
    
    // Additional wait for UI stabilization
    await page.waitForTimeout(3000)
    
    // Ensure all components are rendered
    await page.waitForFunction(() => {
      const mainContent = document.querySelector('#main-content');
      return mainContent && mainContent.children.length > 0;
    }, { timeout: 5000 });
    
    await expect(page).toHaveScreenshot('main-experience.png', {
      fullPage: true,
      threshold: 0.3,
      animations: 'disabled'
    })
  })

  test('mobile layout visual regression', async ({ page }) => {
    await page.click('[data-testid="start-overlay"]')
    
    // Wait for main content and UI stabilization
    await page.waitForSelector('#main-content', { timeout: 15000 })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
    
    await expect(page).toHaveScreenshot('mobile-layout.png', {
      fullPage: true,
      threshold: 0.3,
      animations: 'disabled'
    })
  })

  test('tablet layout visual regression', async ({ page }) => {
    // Set tablet viewport explicitly
    await page.setViewportSize({ width: 768, height: 1024 })
    
    await page.click('[data-testid="start-overlay"]')
    
    // Wait for main content and full loading
    await page.waitForSelector('#main-content', { timeout: 15000 })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
    
    await expect(page).toHaveScreenshot('tablet-layout.png', {
      fullPage: true,
      threshold: 0.3,
      animations: 'disabled',
      clip: { x: 0, y: 0, width: 768, height: 1024 }
    })
  })

  test('high performance mode visual', async ({ page }) => {
    await page.click('[data-testid="start-overlay"]')
    
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
    await page.click('[data-testid="start-overlay"]')
    
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
    
    await page.click('[data-testid="start-overlay"]')
    
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
    await page.click('[data-testid="start-overlay"]')
    
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
    await page.click('[data-testid="start-overlay"]')
    
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
    
    await page.click('[data-testid="start-overlay"]')
    
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
    
    await page.click('[data-testid="start-overlay"]')
    await page.waitForTimeout(1000)
    
    await expect(page).toHaveScreenshot('loading-state.png', {
      fullPage: true,
      threshold: 0.3,
      animations: 'disabled'
    })
  })
})
