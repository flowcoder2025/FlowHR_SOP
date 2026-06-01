import { canAccessPath, roleToRedirectPath } from '@flowhr/api-client';
import { Alert } from '@flowhr/ui';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/auth/session';
import { canRegisterTenant } from '@/lib/operator/tenant-registration/permissions';
import { getOpenDraft, getRegistrationPlans } from '@/lib/operator/tenant-registration/queries';
import { WizardClient } from './wizard-client';

// 세션 + draft/plans(RLS) 의존 — 요청 시점 렌더 강제.
export const dynamic = 'force-dynamic';

/**
 * OP-04 신규 테넌트 등록 7단계 마법사 (ST-006/010, WI-036). 라우트 `/{locale}/operator/tenants/new`.
 *
 * (operator) 레이아웃이 강제 동의 + 강제 2FA 가드를 적용한다. 본 페이지는 세션/역할 가드 후
 * 열린 draft(재진입 복원)와 등록 가능 플랜(3단계 선택)을 초기 fetch 해 client 마법사에 전달한다.
 * 최종 등록/실시간 검증/임시저장은 ./actions(server) 를 client 가 호출한다.
 */
export default async function NewTenantWizardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSessionProfile();
  if (!session) redirect(`/${locale}/login`);
  if (!canAccessPath(session.role, '/operator') || !canRegisterTenant(session.role)) {
    redirect(`/${locale}${roleToRedirectPath(session.role)}`);
  }

  const t = await getTranslations('screens.op-04');
  const [draftResult, plansResult] = await Promise.all([getOpenDraft(), getRegistrationPlans()]);

  const initialDraft = draftResult.ok ? draftResult.draft : null;
  const plans = plansResult.ok ? plansResult.plans : [];

  return (
    <main className="mx-auto flex max-w-[1100px] flex-col gap-5 p-4 py-6">
      <header>
        <h1 className="text-xl font-bold text-text">{t('title')}</h1>
        <p className="mt-1 text-sm text-text-muted">{t('subtitle')}</p>
      </header>

      {plans.length === 0 ? (
        <Alert variant="danger">{t('no_plans')}</Alert>
      ) : (
        <WizardClient locale={locale} plans={plans} initialDraft={initialDraft} />
      )}
    </main>
  );
}
