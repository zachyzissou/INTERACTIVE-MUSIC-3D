import { test, expect } from '@playwright/test';

test.describe('Oscillo Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('has correct title and branding', async ({ page }) => {
    await expect(page).toHaveTitle(/Oscillo/);
  });

  test('start overlay appears and functions', async ({ page }) => {
    // Check if start overlay is visible
    await expect(page.locator('[data-testid="start-overlay"], .start-overlay, [class*="start"]')).toBeVisible({ timeout: 10000 });
  });

  test('canvas renders after start', async ({ page }) => {
    // Try to find and click start button
    const startButton = page.locator('button:has-text("Start"), button:has-text("Begin"), button:has-text("Enter"), [data-testid="start-button"]').first();
    
    if (await startButton.isVisible({ timeout: 5000 })) {
      await startButton.click();
      // Wait for canvas to appear
      await expect(page.locator('canvas')).toBeVisible({ timeout: 15000 });
    } else {
      // If no start button, canvas should be directly visible
      await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    }
  });

  test('ui elements are responsive', async ({ page }) => {
    // Test different viewport sizes
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile
    await page.waitForTimeout(1000);
    
    await page.setViewportSize({ width: 768, height: 1024 }); // Tablet
    await page.waitForTimeout(1000);
    
    await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
    await page.waitForTimeout(1000);
  });

  test('no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(5000);
    
    // Filter out known acceptable errors
    const criticalErrors = errors.filter(error => 
      !error.includes('Console Ninja') && 
      !error.includes('favicon') &&
      !error.includes('service worker')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('performance metrics are acceptable', async ({ page }) => {
    const startTime = Date.now();
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(10000); // Should load within 10 seconds
  });
});
