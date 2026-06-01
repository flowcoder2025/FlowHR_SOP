import { type Page, expect, test } from '@playwright/test';

// OP-04 신규 테넌트 등록 7단계 마법사 (ST-006/010, WI-036).
// 비로그인 가드는 무조건 실행. 로그인 후 렌더는 operator 시드 계정(env gate).
// 실제 등록(register_tenant 트랜잭션)은 WI-035 에서 staging 전 시나리오 실증 완료 —
// E2E 전체 등록은 operator 시드 + 강제 2FA + 테넌트 teardown 인프라 필요(KI-089 동류, 후속).
test.describe('OP-04 신규 테넌트 등록 (ST-006/010)', () => {
  test('미인증 시 /ko/operator/tenants/new → 로그인 리다이렉트(return_url)', async ({ page }) => {
    await page.goto('/ko/operator/tenants/new');
    await expect(page).toHaveURL(/\/ko\/login\?return_url=/);
  });

  test('미인증 시 /en/operator/tenants/new → 로그인 리다이렉트', async ({ page }) => {
    await page.goto('/en/operator/tenants/new');
    await expect(page).toHaveURL(/\/en\/login/);
  });

  const email = process.env.E2E_OPERATOR_EMAIL;
  const password = process.env.E2E_OPERATOR_PASSWORD;
  const enabled = Boolean(email && password);

  const STEP_LABELS = ['회사정보', '도메인', '요금제', '관리자 계정', '모듈 선택', '초기 데이터', '완료 / 검토'];

  async function loginAsOperator(page: Page) {
    await page.goto('/ko/login');
    await page.locator('#email').fill(email!);
    await page.locator('#password').fill(password!);
    await page.getByRole('button', { name: '로그인' }).click();
    await expect(page).toHaveURL(/\/ko\/(operator|me)/);
  }

  test('운영자 로그인 후 마법사 렌더 + 7단계 stepper (operator 시드 필요)', async ({ page }) => {
    test.skip(!enabled, 'E2E_OPERATOR_EMAIL/PASSWORD 미설정 — operator 시드 필요(강제 2FA)');
    await loginAsOperator(page);
    await page.goto('/ko/operator/tenants/new');

    await expect(page.getByRole('heading', { name: '신규 테넌트 등록' })).toBeVisible();
    const nav = page.getByRole('navigation', { name: '단계' });
    for (const label of STEP_LABELS) {
      await expect(nav.getByRole('button', { name: label })).toBeVisible();
    }
    // 1단계 회사정보 폼이 기본 표시.
    await expect(page.getByLabel('회사명')).toBeVisible();
  });
});
