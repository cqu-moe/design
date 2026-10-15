import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';
const baseURL = process.env.DESIGN_E2E_URL;
if (!baseURL || !/^http:\/\/127\.0\.0\.1:\d+$/.test(baseURL)) {
  throw new Error('Use pnpm test:e2e so the suite owns its production build and listener.');
}
const mobileTests =
  /(?:auth|components|action-button|reference-pages|agent-probe|page-state|shell)\.browser\.spec\.ts/;
export default defineConfig({
  testDir: 'tests',
  testMatch: '*.browser.spec.ts',
  fullyParallel: true,
  workers: 2,
  forbidOnly: !!process.env.CI,
  retries: 0,
  outputDir: resolve(process.env.DESIGN_E2E_ARTIFACTS!, 'tests'),
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    serviceWorkers: 'block',
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'chromium-mobile', testMatch: mobileTests, use: { ...devices['Pixel 7'] } },
    { name: 'firefox-desktop', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit-desktop', use: { ...devices['Desktop Safari'] } },
  ],
  reporter: [['list'], ['html', { open: 'never' }], ['json']],
});
