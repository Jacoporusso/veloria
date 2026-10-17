import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

export default defineConfig({
  ...baseConfig,
  testIgnore: [],
  outputDir: 'test-results-e2e-offline',
  use: {
    ...baseConfig.use,
    baseURL: 'http://127.0.0.1:5184',
  },
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 5184 --strictPort',
    url: 'http://127.0.0.1:5184/',
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
