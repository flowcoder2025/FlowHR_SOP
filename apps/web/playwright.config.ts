import { defineConfig, devices } from '@playwright/test';

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  // 단일 staging 백엔드 + 공유 시드 계정(test-employee)을 쓰므로 모든 스펙을 직렬 실행한다.
  // (2FA 스펙이 test-employee 의 totp 상태를 변경 — 병렬 워커 시 login 스펙과 상태 충돌.)
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm start',
    url: BASE_URL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
