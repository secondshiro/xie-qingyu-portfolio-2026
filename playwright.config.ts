import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://127.0.0.1:4331',
    trace: 'retain-on-failure',
    launchOptions: {
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    },
  },
  webServer: {
    command: 'npm run build && npm run serve:test',
    url: 'http://127.0.0.1:4331',
    reuseExistingServer: false,
    // astro check + build 合计约 9 分钟，放宽到 15 分钟。
    timeout: 900_000,
  },
});
