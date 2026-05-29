import { expect, test } from '@playwright/test';

// CM-21 약관/개인정보 (ST-078). 비로그인 조회는 anon RLS(is_active) 공개라 gate 없이 실행한다.
// seed 약관(terms/privacy × ko/en v1.0.0 active)이 staging 에 주입되어 있어야 한다(supabase/seed.sql).
test.describe('CM-21 약관/개인정보 (ST-078)', () => {
  test('비로그인 이용약관(ko) 조회 + 콘솔 에러 0', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/ko/legal/terms');
    await expect(page.getByRole('heading', { name: '이용약관' })).toBeVisible();
    await expect(page.getByText('제1조')).toBeVisible();

    expect(errors, `콘솔 에러: ${errors.join(' | ')}`).toHaveLength(0);
  });

  test('영문 이용약관(en) 조회 + 참고 번역 banner (법적 효력 ko)', async ({ page }) => {
    await page.goto('/en/legal/terms');
    await expect(page.getByText('This is a reference translation.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Article 1 (Purpose)' })).toBeVisible();
  });

  test('비로그인 개인정보처리방침(ko) 조회', async ({ page }) => {
    await page.goto('/ko/legal/privacy');
    await expect(page.getByRole('heading', { name: '개인정보처리방침' })).toBeVisible();
  });

  test('정의되지 않은 문서 type 은 404', async ({ page }) => {
    const res = await page.goto('/ko/legal/bogus');
    expect(res?.status()).toBe(404);
  });

  test('약관 페이지에서 다른 언어로 전환 링크 제공', async ({ page }) => {
    await page.goto('/ko/legal/terms');
    await page.getByRole('link', { name: 'EN' }).click();
    await expect(page).toHaveURL(/\/en\/legal\/terms$/);
    await expect(page.getByText('This is a reference translation.')).toBeVisible();
  });
});
