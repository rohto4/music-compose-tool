import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  // Programmatic setup keeps Vite in Playwright's own process. Windows can
  // otherwise wait indefinitely while tearing down a shell-owned webServer.
  globalSetup: './tests/e2e/global-setup.ts',
  // WAV/STEMS journeys use CPU-heavy OfflineAudioContext rendering. Running two
  // browsers in parallel can push an otherwise passing render past its 120s gate.
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 10_000,
    permissions: ['microphone'],
  },
  projects: [
    { name: 'chromium-fhd', use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1920, height: 1080 }, launchOptions: { args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] } } },
  ],
});
