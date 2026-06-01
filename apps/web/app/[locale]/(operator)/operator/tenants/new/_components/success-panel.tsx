'use client';

import { Alert, Button, Card, CardSubtitle, CardTitle } from '@flowhr/ui';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import type { SendInviteResult } from '@/lib/operator/tenant-registration/actions';
import type { RegisterResult } from '../wizard-client';

/**
 * 등록 완료 화면 — 원자 RPC 성공(WI-035). 와이어프레임의 "이메일 발송 실패" 상태는 stale(원자 트랜잭션이라
 * 부분실패 불가). Resend 미설정(KI-103)이라 메일 발송이 없고, 운영자가 activation URL 을 직접 전달한다.
 * 평문 토큰은 응답에만 존재 → 저장하지 않고 메모리로만 표시(복사). 새로고침/replay 로 URL 이 없으면
 * sendInvite 재발급으로 새 URL 을 받는다.
 */
export function SuccessPanel({
  result,
  onResend,
  onStartNew,
}: {
  result: RegisterResult;
  onResend: (email: string) => Promise<SendInviteResult>;
  onStartNew: () => void;
}) {
  const t = useTranslations('screens.op-04.success');
  const locale = useLocale();

  return (
    <Card className="flex flex-col gap-5">
      <Alert variant="success">{result.alreadyCompleted ? t('already_done') : t('created')}</Alert>

      <div>
        <CardTitle>{t('invites_title')}</CardTitle>
        <CardSubtitle>
          {result.urlsUnavailable ? t('urls_unavailable') : t('invites_hint')}
        </CardSubtitle>
      </div>

      <ul className="flex flex-col gap-3">
        {result.urlsUnavailable
          ? result.adminEmails.map((a) => (
              <InviteRow key={a.email} email={a.email} role={a.role} initialUrl={null} onResend={onResend} />
            ))
          : result.invitations.map((inv) => (
              <InviteRow
                key={inv.email}
                email={inv.email}
                role={inv.role}
                initialUrl={inv.activationUrl}
                onResend={onResend}
              />
            ))}
      </ul>

      <div className="flex flex-wrap gap-3 border-t border-border pt-4">
        <Button type="button" variant="primary" onClick={onStartNew}>
          {t('start_new')}
        </Button>
        <a
          href={`/${locale}/operator`}
          className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-medium text-text hover:bg-surface-2"
        >
          {t('to_dashboard')}
        </a>
      </div>
    </Card>
  );
}

function InviteRow({
  email,
  role,
  initialUrl,
  onResend,
}: {
  email: string;
  role: string;
  initialUrl: string | null;
  onResend: (email: string) => Promise<SendInviteResult>;
}) {
  const t = useTranslations('screens.op-04.success');
  const tRole = useTranslations('screens.op-04.role');
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const roleLabel = role === 'tenant_super' ? tRole('super') : tRole('hr_admin');

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError(true);
    }
  };

  const resend = async () => {
    setBusy(true);
    setError(false);
    const res = await onResend(email);
    setBusy(false);
    if (res.ok) {
      setUrl(res.activationUrl);
    } else {
      setError(true);
    }
  };

  return (
    <li className="rounded-md border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="font-medium text-text">{email}</span>
          <span className="ml-2 rounded bg-surface-2 px-1.5 py-0.5 text-[12px] text-text-muted">
            {roleLabel}
          </span>
        </div>
        <div className="flex gap-2">
          {url && (
            <Button type="button" variant="ghost" onClick={() => void copy()}>
              {copied ? t('copied') : t('copy')}
            </Button>
          )}
          <Button type="button" variant="ghost" disabled={busy} onClick={() => void resend()}>
            {busy ? t('resending') : t('resend')}
          </Button>
        </div>
      </div>
      {url ? (
        <code className="mt-2 block break-all rounded bg-surface-2 px-2 py-1 font-mono text-[12px] text-text">
          {url}
        </code>
      ) : (
        <p className="mt-2 text-[12px] text-text-muted">{t('resend_hint')}</p>
      )}
      {error && <p className="mt-2 text-[12px] text-danger">{t('action_failed')}</p>}
    </li>
  );
}
