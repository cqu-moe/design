import { defineConfig, devices } from '@playwright/test';
export default defineConfig({ testDir:'tests', testMatch:'*.browser.spec.ts', fullyParallel:true, workers:2, use:{ baseURL:'http://127.0.0.1:5173', trace:'retain-on-failure', ...devices['Desktop Chrome'] }, webServer:{ command:'pnpm dev', url:'http://127.0.0.1:5173', reuseExistingServer:!process.env.CI }, reporter:'list' });
