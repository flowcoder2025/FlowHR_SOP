import { expect, test } from '@playwright/test';

test.describe('CM-01 로그인', () => {
  test('한국어 로그인 페이지 렌더 + 콘솔 에러 0', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/ko/login');
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible();

    expect(errors, `콘솔 에러: ${errors.join(' | ')}`).toHaveLength(0);
  });

  test('영어 로그인 페이지 렌더', async ({ page }) => {
    await page.goto('/en/login');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('비밀번호 표시 토글', async ({ page }) => {
    await page.goto('/ko/login');
    const password = page.locator('#password');
    await expect(password).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: '비밀번호 표시' }).click();
    await expect(password).toHaveAttribute('type', 'text');
  });

  test('미인증 상태로 보호 라우트 접근 시 로그인으로 리다이렉트', async ({ page }) => {
    await page.goto('/ko/operator');
    await expect(page).toHaveURL(/\/ko\/login\?return_url=/);
  });

  test('잘못된 자격 증명 → 에러 알림 (service_role 백엔드 필요)', async ({ page }) => {
    test.skip(!process.env.E2E_TEST_EMAIL, 'service_role 백엔드 미설정 — 서버 액션 실행 불가');
    await page.goto('/ko/login');
    await page.locator('#email').fill('nobody@flowhr.test');
    await page.locator('#password').fill('wrongpassword');
    await page.getByRole('button', { name: '로그인' }).click();
    await expect(page.getByText('이메일 또는 비밀번호가 올바르지 않습니다')).toBeVisible();
  });

  test('5회 실패 시 잠금 알림 (service_role 백엔드 필요)', async ({ page }) => {
    test.skip(!process.env.E2E_TEST_EMAIL, 'service_role 백엔드 미설정 — 서버 액션 실행 불가');
    const uniq = `locktest_${Date.now()}@flowhr.test`;
    await page.goto('/ko/login');
    for (let i = 1; i <= 4; i++) {
      await page.locator('#email').fill(uniq);
      await page.locator('#password').fill('wrongpassword');
      await page.getByRole('button', { name: '로그인' }).click();
      await expect(page.getByText(`남은 시도 ${5 - i}회`)).toBeVisible();
    }
    await page.locator('#email').fill(uniq);
    await page.locator('#password').fill('wrongpassword');
    await page.getByRole('button', { name: '로그인' }).click();
    await expect(page.getByText(/계정이 잠겼습니다/)).toBeVisible();
  });

  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;
  const dashboard = process.env.E2E_TEST_DASHBOARD ?? '/me';

  test('실제 로그인 성공 → 역할별 대시보드 (시드 사용자 필요)', async ({ page }) => {
    test.skip(!email || !password, 'E2E_TEST_EMAIL/PASSWORD 미설정 — 시드 사용자 필요');
    await page.goto('/ko/login');
    await page.locator('#email').fill(email!);
    await page.locator('#password').fill(password!);
    await page.getByRole('button', { name: '로그인' }).click();
    await expect(page).toHaveURL(new RegExp(`/ko${dashboard}$`));
  });

  test('접근 불가 return_url 은 무시하고 역할 기본 경로로 (employee→/operator 차단)', async ({ page }) => {
    test.skip(!email || !password, 'E2E_TEST_EMAIL/PASSWORD 미설정 — 시드 사용자 필요');
    await page.goto('/ko/login?return_url=%2Fko%2Foperator');
    await page.locator('#email').fill(email!);
    await page.locator('#password').fill(password!);
    await page.getByRole('button', { name: '로그인' }).click();
    await expect(page).toHaveURL(/\/ko\/me$/);
  });

  test('외부 URL return_url 은 무시 (오픈 리다이렉트 방지)', async ({ page }) => {
    test.skip(!email || !password, 'E2E_TEST_EMAIL/PASSWORD 미설정 — 시드 사용자 필요');
    await page.goto('/ko/login?return_url=https%3A%2F%2Fevil.example.com');
    await page.locator('#email').fill(email!);
    await page.locator('#password').fill(password!);
    await page.getByRole('button', { name: '로그인' }).click();
    await expect(page).toHaveURL(/\/ko\/me$/);
  });
});
