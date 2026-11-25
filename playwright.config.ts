import { defineConfig } from '@playwright/test'

const url = 'http://127.0.0.1:4173'

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  use: {
    baseURL: url,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } } },
    { name: 'firefox', testMatch: '**/mobile.spec.ts', use: { browserName: 'firefox' } },
    { name: 'webkit', testMatch: '**/mobile.spec.ts', use: { browserName: 'webkit' } },
  ],
  webServer: {
    command: 'yarn build && yarn preview --host 127.0.0.1 --port 4173 --strictPort',
    url,
  },
})
