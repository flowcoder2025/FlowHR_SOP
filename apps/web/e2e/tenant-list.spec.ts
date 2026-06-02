import { type Page, expect, test } from '@playwright/test';

// OP-02 테넌트 관리 목록 (ST-007/009, WI-037).
// 비로그인 가드는 무조건 실행. 로그인 후 렌더/상태변경은 operator 시드 계정(env gate, 강제 2FA).
// 목록 조회/검색/필터/상태변경 audit 는 lib 단위 + staging 으로 검증(operator 시드 teardown 인프라는 KI-089 동류).
test.describe('OP-02 테넌트 관리 목록 (ST-007/009)', () => {
  test('미인증 시 /ko/operator/tenants → 로그인 리다이렉트(return_url)', async ({ page }) => {
    await page.goto('/ko/operator/tenants');
    await expect(page).toHaveURL(/\/ko\/login\?return_url=/);
  });

  test('미인증 시 /en/operator/tenants → 로그인 리다이렉트', async ({ page }) => {
    await page.goto('/en/operator/tenants');
    await expect(page).toHaveURL(/\/en\/login/);
  });

  const email = process.env.E2E_OPERATOR_EMAIL;
  const password = process.env.E2E_OPERATOR_PASSWORD;
  const enabled = Boolean(email && password);

  async function loginAsOperator(page: Page) {
    await page.goto('/ko/login');
    await page.locator('#email').fill(email!);
    await page.locator('#password').fill(password!);
    await page.getByRole('button', { name: '로그인' }).click();
    await expect(page).toHaveURL(/\/ko\/(operator|me)/);
  }

  test('운영자 로그인 후 목록 헤더 + 검색/필터 렌더 (operator 시드 필요)', async ({ page }) => {
    test.skip(!enabled, 'E2E_OPERATOR_EMAIL/PASSWORD 미설정 — operator 시드 필요(강제 2FA)');
    await loginAsOperator(page);
    await page.goto('/ko/operator/tenants');

    await expect(page.getByRole('heading', { name: '테넌트 관리' })).toBeVisible();
    await expect(page.getByPlaceholder('회사명 / 사업자번호 / 도메인 검색')).toBeVisible();
    await expect(page.getByRole('button', { name: '신규 테넌트 등록' })).toBeVisible();
  });
});
