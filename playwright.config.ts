import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  
  // Optimized web server configuration for faster startup
  webServer: {
    command: process.env.CI ? 'npm run build && npm start' : 'npm run dev',
    port: 3000,
    reuseExistingServer: true, // Always reuse for testing
    timeout: process.env.CI ? 90000 : 120000, // Increased timeout for CI build
    stderr: 'pipe',
    stdout: 'pipe',
  },
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'off', // Disable tracing for CI to avoid FFmpeg issues
    video: 'off', // Disable video recording for CI
    screenshot: 'only-on-failure',
    // Reduce navigation timeout for faster test execution
    navigationTimeout: 30000,
    actionTimeout: 15000,
  },
  
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Always use system Chrome since it's available in CI
        channel: 'chrome',
        // Optimize viewport for faster rendering
        viewport: { width: 1280, height: 720 }
      },
    },
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        // Optimize mobile viewport
        viewport: { width: 393, height: 851 }
      },
    },
    // Full browser testing only for staging
    ...(process.env.GITHUB_REF === 'refs/heads/staging' ? [
      {
        name: 'firefox',
        use: { ...devices['Desktop Firefox'] },
      },
      {
        name: 'webkit',
        use: { ...devices['Desktop Safari'] },
      },
    ] : []),
  ],
  
  // Optimized timeouts for faster execution
  timeout: process.env.CI ? 30000 : 60000, // Reduced from 60s to 30s for CI
  
  // Faster assertion timeout
  expect: {
    timeout: 8000, // Reduced from 10s to 8s
  },
  
  // Output directory
  outputDir: 'test-results/',
});
