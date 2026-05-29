import { createClient } from '@supabase/supabase-js';
import { expect, test } from '@playwright/test';
import speakeasy from 'speakeasy';

// CM-04 2단계 인증 (ST-004 / WI-020-5).
// 1) 백엔드 불필요 — challenge/세션 없는 화면 진입 가드(항상 실행).
// 2) staging 전체 흐름 — enable → 재로그인 challenge → disable (E2E_TEST_EMAIL + service-role 게이트).
//    test-employee 의 2FA 컬럼을 변경하므로 afterAll 에서 service-role 로 강제 초기화(login.spec 회귀 보호).

const EMAIL = process.env.E2E_TEST_EMAIL;
const PASSWORD = process.env.E2E_TEST_PASSWORD;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

test.describe('CM-04 2FA 화면 가드 (백엔드 불필요)', () => {
  test('challenge 없이 /two-factor 진입 시 로그인으로 (ko)', async ({ page }) => {
    await page.goto('/ko/two-factor');
    await expect(page).toHaveURL(/\/ko\/login/);
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
  });

  test('challenge 없이 /two-factor 진입 시 로그인으로 (en)', async ({ page }) => {
    await page.goto('/en/two-factor');
    await expect(page).toHaveURL(/\/en\/login/);
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  });

  test('비로그인 /me/security 진입 시 로그인으로 (return_url 보존)', async ({ page }) => {
    await page.goto('/ko/me/security');
    await expect(page).toHaveURL(/\/ko\/login\?return_url=/);
  });
});

test.describe('CM-04 2FA 전체 흐름 (staging)', () => {
  test.skip(!EMAIL || !PASSWORD || !SUPABASE_URL || !SERVICE_KEY, 'Supabase/service-role env 미설정');

  async function clearTwoFactor() {
    // users 에 email 컬럼이 없으므로 auth 로 로그인해 user id 를 얻는다.
    // ⚠️ signInWithPassword 를 호출한 클라이언트는 이후 요청을 "로그인한 사용자 토큰"으로 보내
    //    service_role 을 잃는다(RLS 로 update 가 silent no-op). 그래서 update 는 별도의 pristine
    //    service-role 클라이언트로 수행한다.
    const authClient = createClient(SUPABASE_URL!, SERVICE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const signIn = await authClient.auth.signInWithPassword({ email: EMAIL!, password: PASSWORD! });
    const userId = signIn.data.user?.id;
    await authClient.auth.signOut();
    if (!userId) return;

    const dbClient = createClient(SUPABASE_URL!, SERVICE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    await dbClient
      .from('users')
      .update({ totp_enabled: false, totp_secret_encrypted: null, recovery_codes_hash: null })
      .eq('id', userId);
  }

  test.beforeAll(clearTwoFactor);
  test.afterAll(clearTwoFactor);

  async function login(page: import('@playwright/test').Page) {
    await page.goto('/ko/login');
    await page.locator('#email').fill(EMAIL!);
    await page.locator('#password').fill(PASSWORD!);
    await page.getByRole('button', { name: '로그인' }).click();
  }

  test('enable → 재로그인 2FA → disable 전체 흐름', async ({ page, context }) => {
    // 1) 로그인(2FA off) → /me 진입
    await login(page);
    await expect(page).toHaveURL(/\/ko\/me$/);

    // 2) /me/security 에서 2FA 설정 시작 → 비밀 노출 → 코드 검증 → 복구 코드 표시
    await page.goto('/ko/me/security');
    await expect(page.getByRole('heading', { name: '보안 설정' })).toBeVisible();
    await expect(page.getByText('미설정')).toBeVisible();
    await page.getByRole('button', { name: '2단계 인증 설정 시작' }).click();

    const secret = (await page.getByTestId('totp-secret').innerText()).trim();
    expect(secret.length).toBeGreaterThanOrEqual(16);
    const enrollCode = speakeasy.totp({ secret, encoding: 'base32' });
    await page.locator('#code').fill(enrollCode);
    await page.getByRole('button', { name: '확인하고 활성화' }).click();

    // 복구 코드 8개 표시 (서버 revalidate 후에도 단일 패널이 유지되어 코드가 사라지지 않아야 함)
    await expect(page.getByText('복구 코드 8개')).toBeVisible();
    const codeItems = page.getByTestId('recovery-codes').locator('li');
    await expect(codeItems).toHaveCount(8);
    const firstRecovery = (await codeItems.first().innerText()).trim();
    expect(firstRecovery).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);

    // 3) 로그아웃(쿠키 제거) 후 재로그인 → challenge(/two-factor) 진입
    await context.clearCookies();
    await login(page);
    await expect(page).toHaveURL(/\/ko\/two-factor/);
    await expect(page.getByRole('heading', { name: '2단계 인증' })).toBeVisible();

    // 잘못된 코드 → 에러
    await page.locator('#code').fill('000000');
    await page.getByRole('button', { name: '인증', exact: true }).click();
    await expect(page.getByText('코드가 일치하지 않습니다')).toBeVisible();

    // 올바른 코드 → /me
    await page.locator('#code').fill(speakeasy.totp({ secret, encoding: 'base32' }));
    await page.getByRole('button', { name: '인증', exact: true }).click();
    await expect(page).toHaveURL(/\/ko\/me$/);

    // 4) /me/security 에서 2FA 사용 중 확인 → 비밀번호 + TOTP 로 해제
    await page.goto('/ko/me/security');
    await expect(page.getByText('사용 중')).toBeVisible();
    await page.getByRole('button', { name: '2단계 인증 해제' }).click();
    await page.locator('#password').fill(PASSWORD!);
    await page.locator('#code').fill(speakeasy.totp({ secret, encoding: 'base32' }));
    await page.getByRole('button', { name: '해제하기' }).click();
    await expect(page.getByText('2단계 인증이 해제되었습니다')).toBeVisible();
  });

  test('복구 코드로 2FA 통과', async ({ page, context }) => {
    // enable 하여 복구 코드 확보
    await login(page);
    await expect(page).toHaveURL(/\/ko\/me$/); // 로그인 리다이렉트 완료 대기(이후 goto 레이스 방지)
    await page.goto('/ko/me/security');
    await page.getByRole('button', { name: '2단계 인증 설정 시작' }).click();
    const secret = (await page.getByTestId('totp-secret').innerText()).trim();
    await page.locator('#code').fill(speakeasy.totp({ secret, encoding: 'base32' }));
    await page.getByRole('button', { name: '확인하고 활성화' }).click();
    await expect(page.getByText('복구 코드 8개')).toBeVisible();
    const recovery = (await page.getByTestId('recovery-codes').locator('li').first().innerText()).trim();

    // 재로그인 → challenge → 복구 코드 모드로 통과
    await context.clearCookies();
    await login(page);
    await expect(page).toHaveURL(/\/ko\/two-factor/);
    await page.getByRole('button', { name: '복구 코드로 로그인 (앱에 접근할 수 없나요?)' }).click();
    await page.locator('#code').fill(recovery);
    await page.getByRole('button', { name: '인증', exact: true }).click();
    await expect(page).toHaveURL(/\/ko\/me$/);
  });
});
