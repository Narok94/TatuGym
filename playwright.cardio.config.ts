import { defineConfig, devices } from '@playwright/test';

// These UI tests mock authentication/data and never connect to the database.
export default defineConfig({
  testDir: './tests/cardio', workers: 1, timeout: 60000,
  use: { baseURL: 'http://127.0.0.1:5181' },
  webServer: {
    command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5181 --strictPort',
    url: 'http://127.0.0.1:5181', reuseExistingServer: false,
  },
  projects: [
    { name: 'chromium-mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
    { name: 'webkit-mobile', use: { ...devices['iPhone 13'] } },
  ],
});
