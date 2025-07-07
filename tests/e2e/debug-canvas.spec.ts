import { test, expect } from '@playwright/test';

test.describe('Debug Canvas Issue', () => {
  test('detailed canvas debugging', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    page.on('pageerror', err => console.log('ERROR:', err.message));
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check initial state
    console.log('=== INITIAL STATE ===');
    const initialCanvas = await page.locator('canvas').count();
    console.log('Initial canvas count:', initialCanvas);
    
    // Check if start overlay is visible
    const startOverlay = page.locator('[data-testid="start-overlay"]');
    const overlayVisible = await startOverlay.isVisible();
    console.log('Start overlay visible:', overlayVisible);
    
    if (overlayVisible) {
      console.log('=== CLICKING START OVERLAY ===');
      await startOverlay.click();
      
      // Wait for state changes
      await page.waitForTimeout(3000);
      
      // Check canvas count after click
      const postClickCanvas = await page.locator('canvas').count();
      console.log('Post-click canvas count:', postClickCanvas);
      
      // Check if any divs with Scene component exist
      const sceneContainers = await page.locator('div.relative.h-full.w-full').count();
      console.log('Scene containers found:', sceneContainers);
      
      // Check for any Canvas elements from React Three Fiber
      const allCanvases = await page.locator('canvas').all();
      for (let i = 0; i < allCanvases.length; i++) {
        const canvas = allCanvases[i];
        const bbox = await canvas.boundingBox();
        const styles = await canvas.evaluate(el => ({
          display: window.getComputedStyle(el).display,
          visibility: window.getComputedStyle(el).visibility,
          width: el.width,
          height: el.height,
          clientWidth: el.clientWidth,
          clientHeight: el.clientHeight
        }));
        console.log(`Canvas ${i}:`, { bbox, styles });
      }
      
      // Check page content after click
      const pageContent = await page.content();
      const hasCanvasScene = pageContent.includes('CanvasScene') || pageContent.includes('canvas');
      console.log('Page has canvas-related content:', hasCanvasScene);
      
      // Get started state from page
      const startedState = await page.evaluate(() => {
        // Try to access React state (this is a hack for debugging)
        return document.body.textContent?.includes('canvas') || false;
      });
      console.log('Page started state indicators:', startedState);
    }
    
    await page.screenshot({ path: 'test-results/debug-canvas-state.png', fullPage: true });
  });
});
