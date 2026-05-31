import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { expect, test } from '@playwright/test';
import { generateInvitationToken, hashInvitationToken } from '../lib/auth/invitation-token';

// CM-03 계정 활성화 (ST-003 / WI-020-6).
// 1) 백엔드 불필요 — 토큰 없는 진입 가드(항상 실행).
// 2) staging 전체 흐름 — 초대 생성(service-role) → 활성화(비번+약관) → 세션/리다이렉트 → 정리.
//    생성되는 auth.users/public.users/user_consents/invitations 는 beforeEach/afterEach 에서 정리.

const EMAIL = process.env.E2E_TEST_EMAIL;
const PASSWORD = process.env.E2E_TEST_PASSWORD;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 활성화 테스트 전용 이메일(test-employee 와 분리 — 회귀 보호).
const ACT_EMAIL = 'activate-e2e@flowhr.test';

test.describe('CM-03 활성화 진입 가드 (백엔드 불필요)', () => {
  test('토큰 없이 /activate 진입 시 만료/무효 안내(ko)', async ({ page }) => {
    await page.goto('/ko/activate');
    await expect(
      page.getByRole('heading', { name: '활성화 링크가 만료되었거나 유효하지 않습니다' }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: '← 로그인으로 돌아가기' })).toBeVisible();
  });

  test('토큰 없이 /activate 진입(en)', async ({ page }) => {
    await page.goto('/en/activate');
    await expect(
      page.getByRole('heading', { name: 'This activation link has expired or is invalid' }),
    ).toBeVisible();
  });
});

test.describe('CM-03 활성화 전체 흐름 (staging)', () => {
  test.skip(!EMAIL || !PASSWORD || !SUPABASE_URL || !SERVICE_KEY, 'Supabase/service-role env 미설정');

  function admin(): SupabaseClient {
    return createClient(SUPABASE_URL!, SERVICE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  /** 초대 행 생성(평문 토큰 반환). employee 초대(흐름 검증용). */
  async function createInvitation(opts: { expired?: boolean } = {}): Promise<string> {
    const token = generateInvitationToken();
    const expiresAt = new Date(
      Date.now() + (opts.expired ? -3600_000 : 7 * 86_400_000),
    ).toISOString();
    const { error } = await admin().from('invitations').insert({
      token_hash: hashInvitationToken(token),
      email: ACT_EMAIL,
      target_role: 'employee',
      operator_flag: false,
      expires_at: expiresAt,
    });
    if (error) throw error;
    return token;
  }

  /** 활성화로 생성된 계정 + 초대 정리(FK 역참조 순서 — invitations 먼저). */
  async function cleanup(): Promise<void> {
    const a = admin();
    await a.from('invitations').delete().eq('email', ACT_EMAIL);
    const { data: list } = await a.auth.admin.listUsers({ perPage: 1000 });
    const user = list?.users.find((u) => u.email === ACT_EMAIL);
    if (user) {
      await a.from('user_consents').delete().eq('user_id', user.id);
      await a.from('operator_users').delete().eq('user_id', user.id);
      await a.from('users').delete().eq('id', user.id);
      await a.auth.admin.deleteUser(user.id);
    }
  }

  test.beforeEach(cleanup);
  test.afterEach(cleanup);

  test('만료된 토큰 → 만료 안내', async ({ page }) => {
    const token = await createInvitation({ expired: true });
    await page.goto(`/ko/activate?token=${token}`);
    await expect(
      page.getByRole('heading', { name: '활성화 링크가 만료되었거나 유효하지 않습니다' }),
    ).toBeVisible();
    await expect(page.locator('#newPassword')).toHaveCount(0);
  });

  test('유효 토큰 → 초대정보 + 비번설정 + 약관동의 → 활성화 + 로그인', async ({ page }) => {
    const token = await createInvitation();
    await page.goto(`/ko/activate?token=${token}`);

    // 초대 정보(이메일) 표시 + 설정 폼
    await expect(page.getByRole('heading', { name: '계정 활성화' })).toBeVisible();
    await expect(page.getByText(ACT_EMAIL)).toBeVisible();

    await page.locator('#newPassword').fill(PASSWORD!);
    await page.locator('#confirmPassword').fill(PASSWORD!);
    await page.locator('input[name="agree"]').check();
    await page.getByRole('button', { name: '활성화하고 시작하기' }).click();

    // employee → /me 로 자동 로그인 진입
    await expect(page).toHaveURL(/\/ko\/me$/);

    // 토큰 1회용 — 동일 토큰 재사용은 만료/무효
    await page.context().clearCookies();
    await page.goto(`/ko/activate?token=${token}`);
    await expect(
      page.getByRole('heading', { name: '활성화 링크가 만료되었거나 유효하지 않습니다' }),
    ).toBeVisible();
  });

  test('약관 미동의 시 활성화 차단(required)', async ({ page }) => {
    const token = await createInvitation();
    await page.goto(`/ko/activate?token=${token}`);
    await page.locator('#newPassword').fill(PASSWORD!);
    await page.locator('#confirmPassword').fill(PASSWORD!);
    // agree 미체크 — HTML required 로 제출 차단. URL 은 활성화 페이지에 머문다.
    await page.getByRole('button', { name: '활성화하고 시작하기' }).click();
    await expect(page).toHaveURL(/\/ko\/activate/);
    await expect(page.locator('#newPassword')).toBeVisible();
  });
});
