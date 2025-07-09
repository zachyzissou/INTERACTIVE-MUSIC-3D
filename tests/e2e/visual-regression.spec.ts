import { test, expect } from '@playwright/test'

// Helper function to wait for app stabilization
async function waitForAppStability(page: any, enableMockRandom = false) {
  // Enable random mocking if requested (for post-start content)
  if (enableMockRandom) {
    await page.evaluate(() => (window as any).__enableRandomMock?.());
  }
  
  // Wait for network idle
  await page.waitForLoadState('networkidle');
  
  // Wait for fonts to be fully loaded
  await page.evaluate(() => document.fonts.ready);
  
  // Wait for all images to load
  await page.evaluate(() => {
    const images = Array.from(document.images);
    
    function createImagePromise(img: HTMLImageElement) {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = img.onerror = resolve;
      });
    }
    
    const imagePromises = images.map(createImagePromise);
    return Promise.all(imagePromises);
  });
  
  // Wait for any CSS animations to complete and styles to be computed
  await page.waitForTimeout(1000);
}

// Helper function to take a consistent screenshot
async function takeScreenshot(page: any, name: string, options: any = {}) {
  // Final stability check
  await page.waitForTimeout(500);
  
  // Verify viewport is still correct
  const viewport = page.viewportSize();
  if (!viewport) {
    throw new Error('Viewport size is null during screenshot');
  }
  
  return await expect(page).toHaveScreenshot(name, {
    fullPage: true,
    threshold: 0.2,
    animations: 'disabled',
    ...options
  });
}

// Helper function to wait for app to start and become ready
async function waitForAppToStart(page: any) {
  // Click start overlay
  await page.click('[data-testid="start-overlay"]');
  
  // Wait a moment for the click to register
  await page.waitForTimeout(1000);
  
  // Check if start overlay is still visible, if so try clicking again
  try {
    const startOverlay = await page.locator('[data-testid="start-overlay"]');
    if (await startOverlay.isVisible()) {
      // Try clicking again - sometimes the first click doesn't register
      await page.click('[data-testid="start-overlay"]');
      await page.waitForTimeout(1000);
    }
  } catch (e) {
    // Overlay might already be gone, that's fine
  }
  
  // Wait for start overlay to disappear (with longer timeout)
  await page.waitForSelector('[data-testid="start-overlay"]', { state: 'hidden', timeout: 20000 });
  
  // Wait for some key elements that indicate the app has started
  await page.waitForFunction(() => {
    // Check if we have main content or canvas rendered
    const hasMainContent = document.querySelector('#main-content') || 
                          document.querySelector('canvas') ||
                          document.querySelector('main');
    return hasMainContent;
  }, { timeout: 15000 });
  
  // Additional stability wait for everything to render
  await page.waitForTimeout(3000);
}

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page, browserName, isMobile }) => {
    // Explicitly set viewport based on configuration to ensure consistency
    const viewportSizes = {
      'chromium': { width: 1280, height: 720 },
      'firefox': { width: 1280, height: 720 },
      'webkit': { width: 1280, height: 720 },
      'Mobile Chrome': { width: 481, height: 819 },
      'Mobile Safari': { width: 390, height: 664 },
    };
    
    const projectName = test.info().project.name as keyof typeof viewportSizes;
    const viewport = viewportSizes[projectName] || { width: 1280, height: 720 };
    
    await page.setViewportSize(viewport);
    
    // Comprehensive animation and transition disabling
    await page.addInitScript(() => {
      // Disable all CSS animations globally
      const style = document.createElement('style');
      style.textContent = `
        *, *::before, *::after {
          animation-delay: 0s !important;
          animation-duration: 0s !important;
          animation-play-state: paused !important;
          transition-delay: 0s !important;
          transition-duration: 0s !important;
          scroll-behavior: auto !important;
          transform: none !important;
        }
        
        /* Disable specific animation properties */
        .animate-spin, .animate-pulse, .animate-bounce {
          animation: none !important;
        }
        
        /* Disable CSS custom property animations */
        :root {
          --animation-duration: 0s !important;
          --transition-duration: 0s !important;
        }
      `;
      document.head.appendChild(style);
    });

    // Mock audio context issues that might prevent app start
    await page.addInitScript(() => {
      // Mock Web Audio API if it's causing issues
      const win = window as any;
      if (typeof win.AudioContext === 'undefined' && typeof win.webkitAudioContext === 'undefined') {
        class MockAudioContext {
          createGain() { return { connect: () => {}, gain: { value: 1 } }; }
          createOscillator() { return { connect: () => {}, start: () => {}, stop: () => {} }; }
          createAnalyser() { return { connect: () => {}, getByteFrequencyData: () => {} }; }
          createBiquadFilter() { return { connect: () => {} }; }
          createDelay() { return { connect: () => {} }; }
          createConvolver() { return { connect: () => {} }; }
          createScriptProcessor() { return { connect: () => {}, onaudioprocess: null }; }
          get destination() { return { connect: () => {} }; }
          get sampleRate() { return 44100; }
          get currentTime() { return performance.now() / 1000; }
          resume() { return Promise.resolve(); }
          suspend() { return Promise.resolve(); }
          close() { return Promise.resolve(); }
          decodeAudioData() { return Promise.resolve({}); }
        }
        win.AudioContext = MockAudioContext;
        win.webkitAudioContext = MockAudioContext;
      }
    });
    
    // Hide or stabilize dynamic elements that could cause flakiness
    await page.addInitScript(() => {
      // Hide elements that might change between runs
      const hideSelectors = [
        '[data-testid="timestamp"]',
        '.dynamic-content',
        '.advertisement',
        '[data-dynamic="true"]'
      ];
      
      // Function to hide unstable elements
      function hideElementsFromSelector(selector: string) {
        document.querySelectorAll(selector).forEach(el => {
          (el as HTMLElement).style.visibility = 'hidden';
        });
      }
      
      function hideElements() {
        hideSelectors.forEach(hideElementsFromSelector);
      }
      
      // Wait for DOM to be ready, then hide unstable elements
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', hideElements);
      } else {
        hideElements();
      }
    });

    // Mock time and random for consistent rendering
    await page.addInitScript(() => {
      // Store original functions
      const originalRandom = Math.random;
      const originalDate = Date;
      
      // Mock Math.random for visual consistency
      let shouldMockRandom = false;
      (window as any).__enableRandomMock = () => { shouldMockRandom = true; };
      (window as any).__disableRandomMock = () => { shouldMockRandom = false; };
      
      Math.random = () => shouldMockRandom ? 0.5 : originalRandom();
      
      // Fix date for consistency
      const mockDate = new Date('2025-01-01T00:00:00.000Z');
      Date.now = () => mockDate.getTime();
      (window as any).Date = function(...args: any[]) {
        if (args.length === 0) {
          return new originalDate(mockDate);
        }
        return new (originalDate as any)(...args);
      };
      (window as any).Date.now = () => mockDate.getTime();
    });
    
    // Navigate and wait for complete loading
    await page.goto('/', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for critical elements to be present
    await page.waitForSelector('[data-testid="start-overlay"]', { 
      timeout: 15000,
      state: 'visible'
    });
    
    // Comprehensive loading wait sequence
    await page.waitForLoadState('networkidle');
    
    // Wait for fonts to load completely
    await page.evaluate(() => document.fonts.ready);
    
    // Wait for any images to load
    await page.evaluate(() => {
      const images = Array.from(document.images);
      return Promise.all(
        images.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => {
            img.onload = img.onerror = resolve;
          });
        })
      );
    });
    
    // Wait for CSS custom properties to be computed
    await page.waitForTimeout(500);
    
    // Verify viewport size matches expected dimensions
    const actualViewport = page.viewportSize();
    if (!actualViewport || 
        actualViewport.width !== viewport.width || 
        actualViewport.height !== viewport.height) {
      throw new Error(
        `Viewport size mismatch! Expected ${viewport.width}x${viewport.height}, ` +
        `got ${actualViewport?.width}x${actualViewport?.height}`
      );
    }
  })

  test('start overlay visual regression', async ({ page }) => {
    // Additional stability wait for start overlay
    await page.waitForSelector('[data-testid="start-overlay"]', { 
      state: 'visible',
      timeout: 10000 
    });
    
    // Wait for complete stability
    await waitForAppStability(page);
    
    // Take screenshot using helper
    await takeScreenshot(page, 'start-overlay.png');
  })

  test('main experience visual regression', async ({ page }) => {
    // Use helper to start app properly
    await waitForAppToStart(page);
    
    // Wait for full stability with random mocking enabled
    await waitForAppStability(page, true);
    
    // Ensure all components are rendered
    await page.waitForFunction(() => {
      const mainContent = document.querySelector('#main-content') || document.querySelector('main');
      return mainContent && mainContent.children.length > 0;
    }, { timeout: 5000 });
    
    await takeScreenshot(page, 'main-experience.png');
  })

  test('mobile layout visual regression', async ({ page }) => {
    await waitForAppToStart(page);
    await waitForAppStability(page, true);
    await takeScreenshot(page, 'mobile-layout.png');
  })

  test('tablet layout visual regression', async ({ page }) => {
    // Set tablet viewport explicitly
    await page.setViewportSize({ width: 768, height: 1024 })
    
    await waitForAppToStart(page);
    await waitForAppStability(page, true);
    
    await takeScreenshot(page, 'tablet-layout.png', {
      clip: { x: 0, y: 0, width: 768, height: 1024 }
    });
  })

  test('high performance mode visual', async ({ page }) => {
    await waitForAppToStart(page);
    
    // Enable high performance if settings are available
    await page.evaluate(() => {
      const perfStore = (window as any).__PERFORMANCE_STORE__
      if (perfStore) {
        perfStore.setLevel('high')
      }
    })
    
    await waitForAppStability(page, true);
    await takeScreenshot(page, 'high-performance.png');
  })

  test('low performance mode visual', async ({ page }) => {
    await waitForAppToStart(page);
    
    // Enable low performance
    await page.evaluate(() => {
      const perfStore = (window as any).__PERFORMANCE_STORE__
      if (perfStore) {
        perfStore.setLevel('low')
      }
    })
    
    await waitForAppStability(page, true);
    await takeScreenshot(page, 'low-performance.png');
  })

  test('dark theme visual', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await waitForAppToStart(page);
    await waitForAppStability(page, true);
    await takeScreenshot(page, 'dark-theme.png');
  })

  test('audio controls panel visual', async ({ page }) => {
    await waitForAppToStart(page);
    
    // Open audio controls if they exist
    const audioButton = page.locator('[data-testid="audio-button"]')
    if (await audioButton.isVisible()) {
      await audioButton.click()
      await page.waitForTimeout(1000)
    }
    
    await waitForAppStability(page, true);
    await takeScreenshot(page, 'audio-controls.png');
  })

  test('effects panel visual', async ({ page }) => {
    await waitForAppToStart(page);
    
    // Open effects panel if it exists
    const effectsButton = page.locator('[data-testid="effects-button"]')
    if (await effectsButton.isVisible()) {
      await effectsButton.click()
      await page.waitForTimeout(1000)
    }
    
    await waitForAppStability(page, true);
    await takeScreenshot(page, 'effects-panel.png');
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
    await waitForAppStability(page);
    
    await takeScreenshot(page, 'error-state.png');
  })

  test('loading state visual', async ({ page }) => {
    // Slow down network to catch loading state
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 1000)
    })
    
    await page.click('[data-testid="start-overlay"]')
    await page.waitForTimeout(1000)
    
    await takeScreenshot(page, 'loading-state.png');
  })
})
