import { getTranslations } from 'next-intl/server';
import { ErrorState } from '@/components/error-state';
import { Link } from '@/i18n/navigation';

/**
 * CM-06 404 (ST-072 AC-1). notFound() 또는 미매칭 라우트 시 [locale] 레이아웃 안에서 렌더된다.
 * Next 가 응답 상태를 404 로 설정한다.
 */
export default async function NotFound() {
  const t = await getTranslations('system.error.notFound');
  return (
    <ErrorState icon="not-found" tone="default" title={t('title')} description={t('description')}>
      <Link
        href="/"
        prefetch={false}
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-text-on-primary hover:bg-primary-hover"
      >
        {t('back_home')}
      </Link>
    </ErrorState>
  );
}
