import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from '@playwright/test';

const configuredChrome = process.env.CHROME_EXECUTABLE_PATH;
const localChrome = process.platform === 'win32'
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : undefined;
const executablePath = configuredChrome ?? (localChrome && existsSync(localChrome) ? localChrome : undefined);
const viteCliPath = resolve(process.cwd(), 'node_modules', 'vite', 'bin', 'vite.js');
export const viteCommand = `"${process.execPath}" "${viteCliPath}"`;
const existingServerUrl = process.env.VELORIA_E2E_BASE_URL;

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: ['**/offline.spec.ts'],
  // CI shards individual isolated cases, including the long MVP file. Each
  // runner still uses one worker so high-density canvases do not compete.
  fullyParallel: Boolean(process.env.CI),
  reporter: 'list',
  timeout: 60_000,
  expect: { timeout: 8_000 },
  use: {
    baseURL: existingServerUrl ?? 'http://127.0.0.1:5183',
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
  ...(existingServerUrl ? {} : {
    webServer: {
      command: `${viteCommand} --host 127.0.0.1 --port 5183 --strictPort`,
      url: 'http://127.0.0.1:5183/',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  }),
});
