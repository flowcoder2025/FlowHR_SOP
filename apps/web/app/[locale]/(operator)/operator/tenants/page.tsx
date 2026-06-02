import { roleToRedirectPath } from '@flowhr/api-client';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/auth/session';
import { parseListParams } from '@/lib/operator/tenant-list/list';
import { canViewTenantList } from '@/lib/operator/tenant-list/permissions';
import { getPlanFilterOptions, listTenants } from '@/lib/operator/tenant-list/queries';
import { TenantsClient } from './_components/tenants-client';

// 세션 + 목록(RLS, searchParams) 의존 — 요청 시점 렌더 강제.
export const dynamic = 'force-dynamic';

/**
 * OP-02 테넌트 관리 목록 (ST-007/009, WI-037). 라우트 `/{locale}/operator/tenants`.
 *
 * (operator) 레이아웃이 강제 동의/2FA 가드를 적용한다. 본 페이지는 세션/역할 가드 후 searchParams
 * 를 파싱해 목록을 조회(검색/필터/정렬/페이지)하고, 필터 칩용 플랜 옵션과 함께 client 에 전달한다.
 * 상태변경/내보내기는 ./_components 의 client 가 server action 을 호출한다.
 */
export default async function TenantsListPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSessionProfile();
  if (!session) redirect(`/${locale}/login`);
  if (!canViewTenantList(session.role)) {
    redirect(`/${locale}${roleToRedirectPath(session.role)}`);
  }

  const sp = await searchParams;
  const listParams = parseListParams(sp);

  const t = await getTranslations('screens.op-02');
  const [listResult, planOptions] = await Promise.all([
    listTenants(listParams),
    getPlanFilterOptions(),
  ]);

  return (
    <main className="mx-auto flex max-w-[1280px] flex-col gap-5 p-4 py-6">
      <header>
        <h1 className="text-xl font-bold text-text">{t('title')}</h1>
        <p className="mt-1 text-sm text-text-muted">{t('subtitle')}</p>
      </header>

      {listResult.ok ? (
        <TenantsClient
          locale={locale}
          role={session.role}
          data={listResult.data}
          params={listParams}
          planOptions={planOptions}
        />
      ) : (
        <p className="text-sm text-danger">{t('error.fetchFailed')}</p>
      )}
    </main>
  );
}
