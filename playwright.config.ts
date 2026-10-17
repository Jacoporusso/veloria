import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

const configuredChrome = process.env.CHROME_EXECUTABLE_PATH;
const localChrome = process.platform === 'win32'
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : undefined;
const executablePath = configuredChrome ?? (localChrome && existsSync(localChrome) ? localChrome : undefined);

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: ['**/offline.spec.ts'],
  fullyParallel: false,
  reporter: 'list',
  timeout: 60_000,
  expect: { timeout: 8_000 },
  use: {
    baseURL: 'http://127.0.0.1:5183',
    browserName: 'chromium',
    headless: true,
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    launchOptions: executablePath ? { executablePath } : {},
    screenshot: 'only-on-failure',
    // Keep action diagnostics without embedding all map/audio response bodies.
    trace: { mode: 'retain-on-failure', snapshots: false, screenshots: false },
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5183 --strictPort',
    url: 'http://127.0.0.1:5183/',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
