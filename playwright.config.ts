import { defineConfig, devices } from '@playwright/test';

/*
 * E2E config. Runs at phone/tablet/desktop viewports (touch hard-rules apply).
 * The web server starts without Supabase env and without dev bypass, so the
 * MFA gate is active and the suite can assert that non-admins are refused.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'tablet', use: { ...devices['iPad (gen 7)'] } },
    { name: 'phone', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000/api/health',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ADMIN_DEV_BYPASS: 'false',
    },
  },
});
