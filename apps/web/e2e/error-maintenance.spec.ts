import { expect, test } from '@playwright/test';

// CM-06 오류/점검 (ST-072). 404 페이지 + 점검 페이지(비활성 상태)는 DB 의존 없이(또는 fail-open) 동작한다.
// 점검 active 동선(503 rewrite / operator_super 우회)은 staging 토글 수동 실증 — 자동 E2E 는 시드 인프라 필요(KI).
test.describe('CM-06 오류/점검 (ST-072)', () => {
  // 404 문서는 브라우저가 "Failed to load resource: 404" 를 콘솔에 남기므로 콘솔 0 검사는 적용하지 않는다.
  test('미매칭 경로(ko)는 404 + 커스텀 not-found 렌더', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    const res = await page.goto('/ko/this-page-does-not-exist');
    expect(res?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: '페이지를 찾을 수 없습니다' })).toBeVisible();
    await expect(page.getByRole('link', { name: '← FlowHR 홈으로' })).toBeVisible();

    // 페이지 런타임 오류(throw)는 없어야 한다(콘솔 리소스 404 와 구분).
    expect(pageErrors, `페이지 오류: ${pageErrors.join(' | ')}`).toHaveLength(0);
  });

  test('미매칭 경로(en)는 404 + 영문 not-found', async ({ page }) => {
    const res = await page.goto('/en/no-such-route');
    expect(res?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  });

  test('정의되지 않은 약관 type 도 커스텀 404 헤딩', async ({ page }) => {
    const res = await page.goto('/ko/legal/bogus');
    expect(res?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: '페이지를 찾을 수 없습니다' })).toBeVisible();
  });

  test('점검 페이지(ko) — 비활성 시 정상 운영 안내(200)', async ({ page }) => {
    const res = await page.goto('/ko/maintenance');
    expect(res?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: '현재 점검 중이 아닙니다' })).toBeVisible();
  });

  test('점검 페이지(en) — 비활성 안내', async ({ page }) => {
    await page.goto('/en/maintenance');
    await expect(page.getByRole('heading', { name: 'No maintenance in progress' })).toBeVisible();
  });
});
