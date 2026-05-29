import { locales } from '@flowhr/i18n';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Markdown from 'react-markdown';
import { getSessionProfile } from '@/lib/auth/session';
import { getActiveLegalDocument, type LegalDocumentType } from '@/lib/legal/queries';
import { Link } from '@/i18n/navigation';
import { ConsentForm } from './consent-form';

// 세션/동의 상태에 따라 분기하므로 요청 시점 렌더 강제.
export const dynamic = 'force-dynamic';

const VALID_TYPES: readonly LegalDocumentType[] = ['terms', 'privacy'];

export default async function LegalPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; type: string }>;
  searchParams: Promise<{ must_accept?: string; return_url?: string }>;
}) {
  const { locale, type } = await params;
  const { must_accept: mustAcceptParam, return_url: returnUrl } = await searchParams;
  setRequestLocale(locale);

  if (!VALID_TYPES.includes(type as LegalDocumentType)) notFound();
  const docType = type as LegalDocumentType;

  const t = await getTranslations('legal');
  const title = docType === 'terms' ? t('terms_title') : t('privacy_title');
  const doc = await getActiveLegalDocument(docType, locale);

  if (!doc) {
    return (
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-lg font-semibold text-text">{title}</h1>
        <p className="mt-4 text-sm text-text-muted">{t('not_found')}</p>
        <Link href="/" prefetch={false} className="mt-4 inline-block text-sm text-accent hover:underline">
          {t('back_home')}
        </Link>
      </div>
    );
  }

  const mustAccept = mustAcceptParam === 'true';
  // 영문 본문은 참고 번역 — 법적 효력은 ko 라는 banner 표시 (i18n batch-005, 법적 효력 ko).
  const showEnBanner = doc.language === 'en';
  // 강제 동의 폼은 로그인 사용자에게만 의미 — 비로그인은 일반 조회로 표시.
  const profile = mustAccept ? await getSessionProfile() : null;
  const showConsent = mustAccept && profile !== null;
  const otherLocale = locales.find((l) => l !== locale) ?? locale;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      {showEnBanner && (
        <div className="rounded-md border border-border bg-bg p-3 text-sm" role="status">
          <strong className="text-text">{t('en_banner_strong')}</strong>{' '}
          <span className="text-text-muted">{t('en_banner_meta')}</span>
        </div>
      )}

      {mustAccept && (
        <div className="rounded-md border border-warning bg-surface p-3 text-sm" role="status">
          <strong className="text-text">{t('must_accept_title')}</strong>
          <p className="mt-0.5 text-text-muted">{t('must_accept_desc')}</p>
        </div>
      )}

      <article className="rounded-lg border border-border bg-bg p-6">
        <header className="mb-4 border-b border-border pb-3">
          <h1 className="text-lg font-semibold text-text">{doc.title ?? title}</h1>
          <p className="mt-1 text-xs text-text-muted">
            {t('meta_version')} {doc.version}
            {doc.effectiveDate ? ` · ${t('meta_effective')} ${doc.effectiveDate}` : ''}
          </p>
        </header>
        <div className="space-y-3 text-sm leading-relaxed text-text-muted [&_a]:text-accent [&_a]:underline [&_h2]:mt-6 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-text [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5">
          <Markdown>{doc.contentMd ?? ''}</Markdown>
        </div>
      </article>

      {showConsent ? (
        <ConsentForm documentId={doc.id} returnUrl={returnUrl ?? null} locale={locale} />
      ) : (
        <div className="flex items-center justify-between text-sm">
          <Link
            href={`/legal/${docType}`}
            locale={otherLocale}
            prefetch={false}
            className="text-text-muted hover:text-text"
          >
            {otherLocale.toUpperCase()}
          </Link>
          <Link href="/" prefetch={false} className="text-accent hover:underline">
            {t('back_home')}
          </Link>
        </div>
      )}
    </div>
  );
}
