import { defineConfig } from '@playwright/test';

const deployedBaseURL = process.env.PORTFOLIO_BASE_URL;

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: deployedBaseURL ?? 'http://127.0.0.1:4331',
    trace: 'retain-on-failure',
    launchOptions: {
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    },
  },
  webServer: deployedBaseURL ? undefined : {
    command: 'npm run build && npm run serve:test',
    url: 'http://127.0.0.1:4331',
    reuseExistingServer: false,
    // astro check + build 合计约 9 分钟，放宽到 15 分钟。
    timeout: 900_000,
  },
});
