import { defineConfig, devices } from '@playwright/test';
import { SALON_LOCALE, SALON_TIMEZONE, WEB_BASE_URL } from './tests/config/test-env';

export default defineConfig({
  testDir: './tests',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // The UI flow probes several dates for a free slot, so it needs more than the 30s default.
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: WEB_BASE_URL,
    locale: SALON_LOCALE,
    timezoneId: SALON_TIMEZONE,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      // Read-only HTTP checks: no browser involved and safe to spread across workers.
      name: 'api',
      testDir: './tests/api',
      fullyParallel: true,
    },
    {
      // Every case competes for the same live calendar, so UI tests stay serial.
      name: 'ui',
      testDir: './tests/ui',
      use: { ...devices['Desktop Chrome'] },
      fullyParallel: false,
    },
  ],
});
