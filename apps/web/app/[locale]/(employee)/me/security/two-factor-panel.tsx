'use client';

import { Alert, Button, Input, Label } from '@flowhr/ui';
import { useTranslations } from 'next-intl';
import { useActionState, useState } from 'react';
import {
  confirmEnrollAction,
  disableAction,
  startEnrollAction,
  type ConfirmState,
  type DisableState,
  type EnrollState,
} from './actions';

const ENROLL_INIT: EnrollState = { status: 'idle' };
const CONFIRM_INIT: ConfirmState = { status: 'idle' };
const DISABLE_INIT: DisableState = { status: 'idle' };

/**
 * 2FA 상태/등록/해제를 모두 소유하는 단일 클라이언트 컴포넌트.
 * 서버 액션 후 라우트 revalidate 가 일어나도(initialEnabled 가 바뀌어도) 이 컴포넌트는 한 인스턴스로
 * 유지되므로, 활성화 직후 복구 코드 화면(confirm done)이 서버 재렌더로 사라지지 않는다.
 */
export function TwoFactorPanel({
  initialEnabled,
  isOperator,
  continueHref,
}: {
  initialEnabled: boolean;
  isOperator: boolean;
  continueHref: string;
}) {
  const t = useTranslations('me.security');
  const [enrollState, startEnroll, enrolling] = useActionState<EnrollState, FormData>(
    startEnrollAction,
    ENROLL_INIT,
  );
  const [confirmState, confirm, confirming] = useActionState<ConfirmState, FormData>(
    confirmEnrollAction,
    CONFIRM_INIT,
  );
  const [disableState, disable, disabling] = useActionState<DisableState, FormData>(
    disableAction,
    DISABLE_INIT,
  );
  const [disableOpen, setDisableOpen] = useState(false);

  // 1) 활성화 직후 — 복구 코드 1회 표시 (서버 enabled 가 true 로 바뀌어도 이 분기를 우선).
  if (confirmState.status === 'done') {
    return (
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-text">{t('enroll.codes_title')}</h3>
        <p className="text-[13px] text-text-muted">{t('enroll.codes_desc')}</p>
        <ul
          data-testid="recovery-codes"
          className="grid grid-cols-2 gap-2 rounded-md border border-border bg-surface p-3 font-mono text-sm"
        >
          {confirmState.recoveryCodes.map((code) => (
            <li key={code} className="text-center tracking-wider text-text">
              {code}
            </li>
          ))}
        </ul>
        <Alert variant="warning">{t('enroll.codes_warning')}</Alert>
        <a
          href={continueHref}
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white hover:opacity-90"
        >
          {t('enroll.done')}
        </a>
      </div>
    );
  }

  // 2) 등록 진행 중 — QR + 비밀 표시 + 6자리 검증.
  if (enrollState.status === 'enrolling') {
    return (
      <form action={confirm} className="flex flex-col gap-4" noValidate>
        <h3 className="text-sm font-semibold text-text">{t('enroll.scan_title')}</h3>
        <p className="text-[13px] text-text-muted">{t('enroll.scan_desc')}</p>
        {/* eslint-disable-next-line @next/next/no-img-element -- QR 은 서버 생성 data URL(원격 자원 아님) */}
        <img
          src={enrollState.qrDataUrl}
          alt={t('enroll.scan_title')}
          width={200}
          height={200}
          className="mx-auto rounded-md border border-border bg-white p-2"
        />
        <div>
          <p className="mb-1 text-[13px] text-text-muted">{t('enroll.secret_label')}</p>
          <code
            data-testid="totp-secret"
            className="block break-all rounded-md border border-border bg-surface p-2 text-center font-mono text-sm tracking-wider text-text"
          >
            {enrollState.secret}
          </code>
        </div>

        {confirmState.status === 'error' && <Alert variant="danger">{t(confirmState.messageKey)}</Alert>}

        <div>
          <Label htmlFor="code" required>
            {t('enroll.code_label')}
          </Label>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            pattern="\d{6}"
            placeholder="000000"
            className="text-center text-lg tracking-[0.5em]"
            autoFocus
            required
          />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={confirming}>
          {confirming ? t('enroll.confirming') : t('enroll.confirm')}
        </Button>
      </form>
    );
  }

  // 3) 방금 해제 완료.
  if (disableState.status === 'done') {
    return <Alert variant="success">{t('disable.done')}</Alert>;
  }

  // 4) 정적 상태 — 서버가 알려준 현재 활성 여부 기준.
  if (initialEnabled) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-[13px] text-text-muted">{t('enabled_desc')}</p>
        {isOperator ? (
          <p className="rounded-md bg-surface p-3 text-[13px] text-text-muted">
            {t('operator_required_note')}
          </p>
        ) : !disableOpen ? (
          <Button variant="ghost" onClick={() => setDisableOpen(true)} className="self-start text-danger">
            {t('disable.open')}
          </Button>
        ) : (
          <form action={disable} className="flex flex-col gap-3 rounded-md border border-border p-4" noValidate>
            <h3 className="text-sm font-semibold text-text">{t('disable.title')}</h3>
            {disableState.status === 'error' && <Alert variant="danger">{t(disableState.messageKey)}</Alert>}
            <div>
              <Label htmlFor="password" required>
                {t('disable.password_label')}
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <div>
              <Label htmlFor="code" required>
                {t('disable.code_label')}
              </Label>
              <Input id="code" name="code" autoComplete="one-time-code" placeholder="000000" required />
            </div>
            <Button type="submit" variant="danger" disabled={disabling}>
              {disabling ? t('disable.submitting') : t('disable.submit')}
            </Button>
          </form>
        )}
      </div>
    );
  }

  // 5) 미설정 — 등록 시작.
  return (
    <form action={startEnroll} className="flex flex-col gap-3">
      <p className="text-[13px] text-text-muted">{t('disabled_desc')}</p>
      {enrollState.status === 'error' && <Alert variant="danger">{t(enrollState.messageKey)}</Alert>}
      <Button type="submit" size="lg" className="self-start" disabled={enrolling}>
        {enrolling ? t('enroll.starting') : t('enroll.start')}
      </Button>
    </form>
  );
}
