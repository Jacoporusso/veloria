import { defineConfig } from '@playwright/test';
import base from './playwright.config';
export default defineConfig({ ...base, testDir: './tests/playtests', testIgnore: [],
  timeout: 900000, outputDir: 'test-results-natural-prologue', workers: 1 });
