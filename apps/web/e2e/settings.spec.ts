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

  // WI-034 결재라인 조건 분기 편집기 — 라인/조건/단계 컨트롤 렌더 + 저장(즉시) 라운드트립.
  // 실제 요청시점 분기 적용(approvals 생성)은 ST-046(Sprint 6, EM-03 휴가신청 의존)이라 본 E2E 범위 밖.
  test('결재라인 탭에서 조건 분기 편집기 렌더 + 5일 이상=대표 조건 저장 (admin 시드 필요)', async ({
    page,
  }) => {
    test.skip(!enabled, 'E2E_ADMIN_EMAIL/PASSWORD 미설정 — tenant 관리자 시드 필요');
    await loginAsAdmin(page);
    await page.goto('/ko/admin/settings?tab=approval_lines');

    // 라인 추가 → 편집기(기본 결재선 + 단계 추가 + 조건 추가)가 렌더.
    await page.getByRole('button', { name: '라인 추가' }).click();
    await expect(page.getByText('기본 결재선')).toBeVisible();
    await expect(page.getByRole('button', { name: '+ 단계 추가' })).toBeVisible();

    await page.locator('input[placeholder="휴가 기본 결재선"]').first().fill('휴가 결재선');

    // 조건 추가 → 필드/연산자/비교값 컨트롤이 나타남.
    await page.getByRole('button', { name: '+ 조건 추가' }).click();
    await expect(page.getByText('필드').first()).toBeVisible();
    await expect(page.getByText('비교값').first()).toBeVisible();

    // 비교값(휴가 일수 >= 5) 입력 후 즉시 저장.
    await page.locator('input[type="number"]').first().fill('5');
    await page.getByRole('button', { name: '저장', exact: true }).click();

    // 즉시 적용 성공 알림(부분 검증) — 실패 시 approval_invalid 등 에러 알림.
    await expect(page.getByText('변경 사항이 즉시 적용되었습니다.')).toBeVisible();
  });
});
