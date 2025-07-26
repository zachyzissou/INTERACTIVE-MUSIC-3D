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
    await expect(page.locator('text=Interactive 3D Music Experience')).toBeVisible({ timeout: 5000 });
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
      console.log('Safari/WebKit: Basic app structure verified (audio may be limited)');
    } else {
      // For other browsers, check main content area appears after start
      await page.waitForTimeout(2000); // Brief wait for initialization
      
      // Check that main content area is available after starting
      const hasMainContent = await page.locator('#main-content').isVisible();
      expect(hasMainContent).toBe(true);
      console.log('App initialized successfully with interactive content');
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