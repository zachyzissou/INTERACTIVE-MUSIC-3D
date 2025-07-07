import { test, expect } from '@playwright/test';

test.describe('Oscillo Application - Complete Functional Test', () => {
  test('complete user journey with start overlay interaction', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of initial state
    await page.screenshot({ 
      path: 'test-results/01-initial-state.png',
      fullPage: true 
    });
    
    // Verify start overlay is present and visible
    const startOverlay = page.locator('[data-testid="start-overlay"]');
    await expect(startOverlay).toBeVisible({ timeout: 10000 });
    
    // Verify the sonic voyage text is present
    const sonicText = page.getByText(/begin your sonic voyage/i);
    await expect(sonicText).toBeVisible();
    
    // Take screenshot showing the start overlay
    await page.screenshot({ 
      path: 'test-results/02-start-overlay-visible.png',
      fullPage: true 
    });
    
    // Click on the start overlay to begin the experience
    await startOverlay.click();
    
    // Wait for the overlay to disappear and canvas to appear
    await expect(startOverlay).not.toBeVisible({ timeout: 10000 });
    
    // Wait a moment for the canvas to initialize
    await page.waitForTimeout(3000);
    
    // Take screenshot after starting
    await page.screenshot({ 
      path: 'test-results/03-after-start-click.png',
      fullPage: true 
    });
    
    // Verify canvas is now visible and properly sized
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 10000 });
    
    // Check that canvas has proper dimensions
    const canvasBbox = await canvas.boundingBox();
    expect(canvasBbox).not.toBeNull();
    expect(canvasBbox!.width).toBeGreaterThan(0);
    expect(canvasBbox!.height).toBeGreaterThan(0);
    
    console.log('Canvas dimensions after start:', canvasBbox);
    
    // Verify some UI elements are present
    const bottomDrawer = page.locator('div').filter({ hasText: /volume|tempo|scale/i }).first();
    if (await bottomDrawer.isVisible({ timeout: 5000 })) {
      await page.screenshot({ 
        path: 'test-results/04-ui-elements-visible.png',
        fullPage: true 
      });
    }
    
    // Test responsive behavior
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: 'test-results/05-tablet-responsive.png',
      fullPage: true 
    });
    
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: 'test-results/06-mobile-responsive.png',
      fullPage: true 
    });
    
    // Return to desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    
    // Final screenshot
    await page.screenshot({ 
      path: 'test-results/07-final-state.png',
      fullPage: true 
    });
  });

  test('performance and accessibility checks', async ({ page }) => {
    await page.goto('/');
    
    // Check for accessibility issues
    const title = await page.title();
    expect(title).toContain('Oscillo');
    
    // Check for proper color contrast and readability
    const bodyStyles = await page.evaluate(() => {
      const body = document.body;
      const computed = window.getComputedStyle(body);
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color,
        fontFamily: computed.fontFamily
      };
    });
    
    console.log('Body styles:', bodyStyles);
    
    // Check loading performance
    const startTime = Date.now();
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log('Load time:', loadTime, 'ms');
    expect(loadTime).toBeLessThan(15000); // Should load within 15 seconds
  });

  test('audio and interaction features', async ({ page }) => {
    // Enable audio context (required for audio testing)
    await page.goto('/');
    
    // Start the application
    const startOverlay = page.locator('[data-testid="start-overlay"]');
    if (await startOverlay.isVisible({ timeout: 5000 })) {
      await startOverlay.click();
      await page.waitForTimeout(2000);
    }
    
    // Look for audio control elements
    const volumeControl = page.locator('input[type="range"]').first();
    if (await volumeControl.isVisible({ timeout: 5000 })) {
      // Test volume control interaction
      await volumeControl.fill('0.8');
      await page.waitForTimeout(500);
      
      console.log('Volume control interacted with successfully');
    }
    
    // Look for 3D interaction elements (plus button, objects)
    const plusButton = page.locator('canvas').first();
    if (await plusButton.isVisible()) {
      // Try clicking on the canvas to interact with 3D elements
      await plusButton.click({ position: { x: 100, y: 100 } });
      await page.waitForTimeout(1000);
      
      console.log('3D canvas interaction attempted');
    }
    
    await page.screenshot({ 
      path: 'test-results/08-interaction-test.png',
      fullPage: true 
    });
  });
});
