import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { Link } from '@/i18n/navigation';

/** 비인증 법적 문서 shell (CM-21). 푸터 링크/강제 동의 양쪽에서 진입 — 전체폭 본문. */
export default async function LegalLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="flex items-center justify-between border-b border-border bg-bg px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-bold text-primary">
          FlowHR
        </Link>
      </header>
      <main className="flex-1 px-4 py-8 sm:px-6">{children}</main>
      <footer className="border-t border-border py-4 text-center text-xs text-text-subtle">
        © 2026 FlowHR
      </footer>
    </div>
  );
}
