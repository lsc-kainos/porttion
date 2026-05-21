import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  // Sobe API (3001) e web (3000) em paralelo. Localmente, o .env.local na raiz
  // injeta segredos no shell antes do dev; em CI as envs vêm do workflow.
  // E2E_TEST=1 ativa o CredentialsProvider de testes (NODE_ENV não funciona
  // porque `next dev` força development).
  webServer: [
    {
      command:
        '[ -f ../../.env.local ] && set -a && . ../../.env.local && set +a; cd ../api && npm run start:dev',
      url: 'http://localhost:3001/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command:
        '[ -f ../../.env.local ] && set -a && . ../../.env.local && set +a; E2E_TEST=1 NODE_ENV=development npm run dev',
      url: 'http://localhost:3000/login',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'iphone-13',
      use: { ...devices['iPhone 13'] },
    },
  ],
});
