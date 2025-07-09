import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  // Web server configuration - automatically start dev server for tests
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes
  },
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Use system Chrome browser to avoid download issues
        channel: 'chrome'
      },
    },
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'] 
      },
    },
    // Uncomment when ready for full browser testing
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
  
  // Global test timeout
  timeout: 60 * 1000, // 1 minute per test
  
  // Expect timeout for assertions
  expect: {
    timeout: 10 * 1000, // 10 seconds
  },
});
