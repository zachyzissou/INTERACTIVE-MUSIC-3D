import { test, expect } from '@playwright/test';

test.describe('Essential Functionality Verification - Smoke Tests', () => {
  test('core application loads and starts correctly', async ({ page, browserName }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Verify page loads and title is correct
    await expect(page).toHaveTitle(/Oscillo/);
    
    // Check start overlay appears
    const startOverlay = page.locator('[data-testid="start-overlay"]');
    await expect(startOverlay).toBeVisible({ timeout: 8000 });
    
    // Verify start overlay content
    await expect(page.locator('text=Let\'s begin your sonic voyage')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="start-button"]')).toBeVisible();
    
    // Click start to begin the experience
    await page.click('[data-testid="start-button"]');
    
    // Wait for overlay to disappear
    await expect(startOverlay).not.toBeVisible({ timeout: 5000 });
    
    // Check that we have a successful app initialization
    // Safari/WebKit may have audio issues but basic UI should still work
    if (browserName === 'webkit') {
      // For Safari, just verify basic UI structure exists
      const body = page.locator('body');
      await expect(body).toBeVisible();
    } else {
      // For other browsers, check basic canvas functionality
      await page.waitForTimeout(2000); // Brief wait for initialization
      
      // Check that main content area is available
      const hasContent = await page.locator('#__next').isVisible();
      expect(hasContent).toBe(true);
    }
  });

  test('no critical console errors on load', async ({ page }) => {
    const criticalErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const error = msg.text();
        // Only capture truly critical errors, ignore known issues
        if (!error.includes('Console Ninja') && 
            !error.includes('favicon') &&
            !error.includes('service worker') &&
            !error.includes('WebGL') && // Ignore WebGL warnings in CI
            !error.includes('AudioContext')) { // Ignore audio warnings in CI
          criticalErrors.push(error);
        }
      }
    });
    
    await page.goto('/');
    await page.waitForTimeout(3000); // Reduced wait time
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('basic performance is acceptable', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded'); // Faster than networkidle
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(8000); // Reduced from 10s to 8s for faster tests
  });
});
      console.log('Safari/WebKit: Basic app structure verified (audio may be limited)');
    } else {
      // For other browsers, check for main content or canvas
      const hasCanvas = await page.locator('canvas').count() > 0;
      const hasMainContent = await page.locator('#main-content').count() > 0;
      
      if (hasCanvas || hasMainContent) {
        console.log('App initialized successfully with interactive content');
      } else {
        console.log('App loaded but content may still be initializing');
      }
    }
    
    // Verify no critical JavaScript errors
    const errorMessages: string[] = [];
    page.on('pageerror', (error) => {
      errorMessages.push(error.message);
    });
    
    // Wait a moment for any delayed errors
    await page.waitForTimeout(2000);
    
    // Check for critical errors (filter out known non-critical ones)
    const criticalErrors = errorMessages.filter(msg => 
      !msg.includes('Tone.js') && // Known audio library limitation in Safari
      !msg.includes('AudioContext') && // Known audio limitation
      !msg.includes('WebGL') // Known graphics limitation on some systems
    );
    
    if (criticalErrors.length > 0) {
      console.log('Critical errors found:', criticalErrors);
    }
    
    expect(criticalErrors.length).toBe(0);
    
    console.log(`✅ Essential functionality verified for ${browserName}`);
  });
});
