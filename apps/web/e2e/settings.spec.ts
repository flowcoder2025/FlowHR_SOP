import { type Page, expect, test } from '@playwright/test';

// TA-13 회사 설정 (ST-053, WI-033).
// 비로그인 가드는 무조건 실행. 로그인 후 렌더/탭은 tenant 관리자 시드 계정(env gate).
// 실제 저장(즉시/예약 mutation)은 staging 수동 실증 — 시드 setup/teardown 인프라 부재(KI-089 동류).
test.describe('TA-13 회사 설정 (ST-053)', () => {
  test('미인증 시 /ko/admin/settings → 로그인 리다이렉트(return_url)', async ({ page }) => {
    await page.goto('/ko/admin/settings');
    await expect(page).toHaveURL(/\/ko\/login\?return_url=/);
  });

  test('미인증 시 /en/admin/settings → 로그인 리다이렉트', async ({ page }) => {
    await page.goto('/en/admin/settings');
    await expect(page).toHaveURL(/\/en\/login/);
  });

  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  const enabled = Boolean(email && password);

  const TAB_LABELS = [
    '회사정보',
    '근무정책',
    '휴가정책',
    '결재라인',
    '역할권한',
    '알림',
    '문서양식',
    '보안',
    '감사로그',
  ];

  async function loginAsAdmin(page: Page) {
    await page.goto('/ko/login');
    await page.locator('#email').fill(email!);
    await page.locator('#password').fill(password!);
    await page.getByRole('button', { name: '로그인' }).click();
    await expect(page).toHaveURL(/\/ko\/admin/);
  }

  test('관리자 로그인 후 설정 렌더 + 9탭 (admin 시드 필요)', async ({ page }) => {
    test.skip(!enabled, 'E2E_ADMIN_EMAIL/PASSWORD 미설정 — tenant 관리자 시드 필요');
    await loginAsAdmin(page);
    await page.goto('/ko/admin/settings');

    await expect(page.getByRole('heading', { name: '회사 설정' })).toBeVisible();
    const nav = page.getByRole('navigation', { name: '회사 설정' });
    for (const label of TAB_LABELS) {
      await expect(nav.getByRole('button', { name: label })).toBeVisible();
    }
  });

  test('?tab=leave_policy 직접 진입 시 휴가정책 탭 활성', async ({ page }) => {
    test.skip(!enabled, 'E2E_ADMIN_EMAIL/PASSWORD 미설정');
    await loginAsAdmin(page);
    await page.goto('/ko/admin/settings?tab=leave_policy');
    await expect(page.getByRole('button', { name: '휴가정책' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('탭 전환 시 URL ?tab= 동기화', async ({ page }) => {
    test.skip(!enabled, 'E2E_ADMIN_EMAIL/PASSWORD 미설정');
    await loginAsAdmin(page);
    await page.goto('/ko/admin/settings');
    await page.getByRole('navigation', { name: '회사 설정' }).getByRole('button', { name: '결재라인' }).click();
    await expect(page).toHaveURL(/[?&]tab=approval_lines/);
  });

  test('잘못된 ?tab 값은 첫 탭(회사정보)으로 폴백', async ({ page }) => {
    test.skip(!enabled, 'E2E_ADMIN_EMAIL/PASSWORD 미설정');
    await loginAsAdmin(page);
    await page.goto('/ko/admin/settings?tab=bogus');
    await expect(page.getByRole('button', { name: '회사정보' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});
