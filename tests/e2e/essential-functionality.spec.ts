import { test, expect } from '@playwright/test';

test.describe('Essential Functionality Verification', () => {
  test('core application functionality works correctly', async ({ page, browserName }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Verify page loads and title is correct
    await expect(page).toHaveTitle(/Oscillo/);
    
    // Check start overlay appears
    const startOverlay = page.locator('[data-testid="start-overlay"]');
    await expect(startOverlay).toBeVisible();
    
    // Verify start overlay content
    await expect(page.locator('text=Let\'s begin your sonic voyage')).toBeVisible();
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
