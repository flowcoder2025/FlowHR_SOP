import { expect, test } from '@playwright/test';

// CM-02 비밀번호 찾기/재설정 (ST-002). 이메일 실송/cross-device 클릭은 Free SMTP 제약으로 자동 E2E 불가 → KI.
// 여기서는 이메일 발송 없이 검증 가능한 동선만 다룬다:
//   - forgot-password 렌더 + 제출 시 계정 노출 없는 동일 'sent' 응답
//   - reset-password 를 recovery 세션 없이 직접 열면 만료/무효 안내
test.describe('CM-02 비밀번호 찾기 (ST-002)', () => {
  test('비밀번호 찾기 페이지(ko) 렌더 + 콘솔 에러 0', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/ko/forgot-password');
    await expect(page.getByRole('heading', { name: '비밀번호 찾기' })).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.getByRole('button', { name: '재설정 링크 받기' })).toBeVisible();

    expect(errors, `콘솔 에러: ${errors.join(' | ')}`).toHaveLength(0);
  });

  test('비밀번호 찾기 페이지(en) 렌더', async ({ page }) => {
    await page.goto('/en/forgot-password');
    await expect(page.getByRole('heading', { name: 'Forgot password' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send reset link' })).toBeVisible();
  });

  test('이메일 제출 시 계정 존재 노출 없는 동일 발송 안내(sent) — 서버 액션 필요', async ({ page }) => {
    test.skip(!process.env.E2E_TEST_EMAIL, 'Supabase 백엔드 미설정 — 서버 액션 실행 불가');

    await page.goto('/ko/forgot-password');
    // 명백히 미등록인 이메일 — Supabase 는 계정 열거 방지를 위해 메일을 보내지 않고 동일 200 을 반환.
    await page.locator('#email').fill('e2e-nonexistent@flowhr.test');
    await page.getByRole('button', { name: '재설정 링크 받기' }).click();

    await expect(page.getByText('등록되어 있으면', { exact: false })).toBeVisible({ timeout: 5_000 });
    // 폼은 사라지고 sent 안내만 — 계정 존재 여부를 알 수 없다.
    await expect(page.locator('#email')).toHaveCount(0);
  });

  test('재설정 페이지를 recovery 세션 없이 열면 만료/무효 안내(ko)', async ({ page }) => {
    await page.goto('/ko/reset-password');
    await expect(
      page.getByRole('heading', { name: '재설정 링크가 만료되었거나 유효하지 않습니다' }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: '비밀번호 찾기 다시 하기' })).toBeVisible();
    // 비밀번호 입력 필드는 노출되지 않는다.
    await expect(page.locator('#newPassword')).toHaveCount(0);
  });

  test('error=invalid_token 쿼리도 만료 안내(en)', async ({ page }) => {
    await page.goto('/en/reset-password?error=invalid_token');
    await expect(
      page.getByRole('heading', { name: 'This reset link has expired or is invalid' }),
    ).toBeVisible();
  });
});
