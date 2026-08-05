import { defineConfig, devices } from '@playwright/test'

const isCI = !!process.env.CI

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: isCI ? 2 : 0,
  reporter: isCI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm run db:generate && npm run build && npm run start',
      cwd: '../backend',
      url: 'http://localhost:4000/api/health',
      timeout: 180_000,
      env: { ...process.env, PAYSTACK_MOCK: 'true', NODE_ENV: 'test' },
    },
    {
      command: isCI ? 'npm run build && npm run start' : 'npm run dev',
      cwd: '.',
      url: 'http://localhost:3000',
      timeout: 180_000,
    },
  ],
})
