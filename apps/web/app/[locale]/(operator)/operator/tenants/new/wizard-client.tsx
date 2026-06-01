'use client';

import { Alert, Button, Stepper } from '@flowhr/ui';
import {
  type SlugCheckReason,
  normalizeBusinessNumber,
  validateSlugFormat,
} from '@flowhr/schemas';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { z } from 'zod';
import type { InvitationDelivery, RegisterTenantError } from '@/lib/operator/tenant-registration/actions';
import type { CheckResult, OpenDraft, PlanOption } from '@/lib/operator/tenant-registration/queries';
import {
  STEP_KEYS,
  type StepKey,
  type WizardForm,
  buildRegistrationPayload,
  emptyWizardForm,
  isStepComplete,
  parseDraftFormData,
  serializeDraftFormData,
  validateFullPayload,
} from '@/lib/operator/tenant-registration/wizard';
import {
  checkAdminEmailAction,
  checkBusinessNumberAction,
  checkDomainAction,
  registerTenantAction,
  saveDraftAction,
  sendInviteAction,
} from './actions';
import { StepAdmin } from './_steps/step-admin';
import { StepCompany } from './_steps/step-company';
import { StepDomain } from './_steps/step-domain';
import { StepInitialData } from './_steps/step-initial-data';
import { StepModules } from './_steps/step-modules';
import { StepPlan } from './_steps/step-plan';
import { StepReview } from './_steps/step-review';
import { SuccessPanel } from './_components/success-panel';

// ── 실시간 중복검사 스냅샷 (debounce + sequence token) ───────────────────────────
export type CheckPhase = 'idle' | 'checking' | 'done';
export interface CheckSnapshot {
  phase: CheckPhase;
  /** 마지막 확인된 정규화 값. 현재 입력의 정규화와 일치할 때만 게이트 통과로 인정. */
  value: string;
  available: boolean;
  reason: SlugCheckReason | null;
}

const IDLE_SNAPSHOT: CheckSnapshot = { phase: 'idle', value: '', available: false, reason: null };

/**
 * 단일 필드 실시간 중복검사 — 300ms debounce + per-field seq token 으로 stale 응답 무시(codex 2라운드).
 * normalize 가 null(형식 위반)이면 원격 호출 없이 즉시 invalid 로 표기.
 */
function useAvailabilityCheck(
  rawValue: string,
  normalize: (v: string) => string | null,
  remote: (v: string) => Promise<CheckResult>,
): CheckSnapshot {
  const [snap, setSnap] = useState<CheckSnapshot>(IDLE_SNAPSHOT);
  const seqRef = useRef(0);

  useEffect(() => {
    const normalized = normalize(rawValue);
    if (rawValue.trim().length === 0) {
      setSnap(IDLE_SNAPSHOT);
      return;
    }
    if (normalized === null) {
      seqRef.current += 1; // in-flight 응답 무효화
      setSnap({ phase: 'done', value: '', available: false, reason: 'invalid_format' });
      return;
    }
    setSnap((s) => ({ ...s, phase: 'checking' }));
    const seq = (seqRef.current += 1);
    const timer = setTimeout(() => {
      void remote(normalized).then((res) => {
        if (seq !== seqRef.current) return; // 더 최신 입력이 있음 → 폐기
        if (res.ok) {
          setSnap({ phase: 'done', value: res.value, available: res.available, reason: res.reason });
        } else {
          setSnap({ phase: 'done', value: normalized, available: false, reason: 'taken' });
        }
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [rawValue, normalize, remote]);

  return snap;
}

function confirmed(snap: CheckSnapshot, normalized: string | null): boolean {
  return snap.phase === 'done' && snap.available && normalized !== null && snap.value === normalized;
}

// ── reducer ──────────────────────────────────────────────────────────────────
export interface RegisterResult {
  tenantId: string;
  draftId: string;
  alreadyCompleted: boolean;
  invitations: InvitationDelivery[];
  /** 새로고침/replay 로 평문 activation URL 을 재표시할 수 없는 상태(sendInvite 재발급 안내). */
  urlsUnavailable: boolean;
  adminEmails: { email: string; role: string }[];
}

interface WizardState {
  form: WizardForm;
  step: number; // 0-based (STEP_KEYS index)
  highestReached: number;
  /** 폼 변경 단조 카운터. rev > savedRev 이면 미저장 변경 존재(dirty). */
  rev: number;
  /** 마지막으로 autosave 가 성공한 rev. rev === savedRev 면 저장됨(인디케이터). */
  savedRev: number;
  submitting: boolean;
  submitError: RegisterTenantError | null;
  result: RegisterResult | null;
}

type WizardAction =
  | { type: 'PATCH'; updater: (f: WizardForm) => WizardForm }
  | { type: 'SET_STEP'; step: number }
  | { type: 'SAVED'; rev: number }
  | { type: 'BEGIN_SUBMIT' }
  | { type: 'SUBMIT_SUCCESS'; result: RegisterResult }
  | { type: 'SUBMIT_ERROR'; error: RegisterTenantError }
  | { type: 'RESET' };

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'PATCH':
      return {
        ...state,
        form: action.updater(state.form),
        rev: state.rev + 1,
        submitError: null,
      };
    case 'SET_STEP':
      return { ...state, step: action.step, highestReached: Math.max(state.highestReached, action.step) };
    case 'SAVED':
      // 저장한 rev 가 현재 rev 와 같을 때만 clean — 저장 in-flight 중 새 편집(rev 증가)은 dirty 유지.
      return { ...state, savedRev: Math.max(state.savedRev, action.rev) };
    case 'BEGIN_SUBMIT':
      return { ...state, submitting: true, submitError: null };
    case 'SUBMIT_SUCCESS':
      return { ...state, submitting: false, result: action.result };
    case 'SUBMIT_ERROR':
      return { ...state, submitting: false, submitError: action.error };
    case 'RESET':
      return {
        form: emptyWizardForm(),
        step: 0,
        highestReached: 0,
        rev: 0,
        savedRev: 0,
        submitting: false,
        submitError: null,
        result: null,
      };
    default:
      return state;
  }
}

const RECOVERY_KEY = 'flowhr.op04.recovery';

export function WizardClient({
  locale: _locale,
  plans,
  initialDraft,
}: {
  locale: string;
  plans: PlanOption[];
  initialDraft: OpenDraft | null;
}) {
  const t = useTranslations('screens.op-04');

  // draft 복원 — 열린 draft 가 있으면 폼/단계/멱등키 재구성.
  const restored = useMemo(
    () => (initialDraft ? parseDraftFormData(initialDraft.formData) : null),
    [initialDraft],
  );
  // 등록 1건당 멱등키 1개 — startNew(RESET) 시 재발급해 직전 등록 키 재사용을 차단(설계 불변식).
  const [idempotencyKey, setIdempotencyKey] = useState<string>(
    () => restored?.idempotencyKey ?? globalThis.crypto.randomUUID(),
  );

  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const form = restored?.form ?? emptyWizardForm();
    const startStep = initialDraft
      ? Math.min(Math.max(initialDraft.currentStep - 1, 0), STEP_KEYS.length - 1)
      : 0;
    return {
      form,
      step: startStep,
      highestReached: startStep,
      rev: 0,
      savedRev: 0,
      submitting: false,
      submitError: null,
      result: null,
    };
  });

  const dirty = state.rev > state.savedRev;
  const showSaved = state.savedRev > 0 && state.rev === state.savedRev;

  const update = useCallback(
    (updater: (f: WizardForm) => WizardForm) => dispatch({ type: 'PATCH', updater }),
    [],
  );

  // 최신 form/step 을 async 콜백에서 읽기 위한 ref.
  const formRef = useRef(state.form);
  formRef.current = state.form;
  const stepRef = useRef(state.step);
  stepRef.current = state.step;
  const revRef = useRef(state.rev);
  revRef.current = state.rev;
  const draftIdRef = useRef<string | null>(initialDraft?.id ?? null);
  const frozenRef = useRef(false); // 제출 시작 후 신규 저장 hard-stop
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── 단일 저장 큐(병렬 saveDraft 금지, latest snapshot coalesce) ──
  type DraftInput = { current_step: number; form_data: Record<string, unknown> };
  const queueRef = useRef<{
    pending: { input: DraftInput; rev: number } | null;
    draining: Promise<void> | null;
  }>({ pending: null, draining: null });

  const drain = useCallback(async (): Promise<void> => {
    try {
      while (queueRef.current.pending) {
        const { input, rev } = queueRef.current.pending;
        queueRef.current.pending = null;
        const res = await saveDraftAction(input);
        if (res.ok) {
          draftIdRef.current = res.draftId;
          // 저장한 rev 까지 clean 처리(저장 중 새 편집은 rev 증가로 dirty 유지 → 추가 저장 트리거).
          dispatch({ type: 'SAVED', rev });
        }
      }
    } finally {
      queueRef.current.draining = null;
    }
  }, []);

  const scheduleSave = useCallback(
    (form: WizardForm, step: number, rev: number) => {
      if (frozenRef.current) return; // 제출 후 신규 저장 차단(stale autosave → 신규 draft insert 방지)
      queueRef.current.pending = {
        input: {
          current_step: Math.min(Math.max(step + 1, 1), 7),
          form_data: serializeDraftFormData(form, idempotencyKey),
        },
        rev,
      };
      if (!queueRef.current.draining) queueRef.current.draining = drain();
    },
    [drain, idempotencyKey],
  );

  const flushSaves = useCallback(async (): Promise<void> => {
    if (queueRef.current.draining) await queueRef.current.draining;
    if (queueRef.current.pending) {
      queueRef.current.draining = drain();
      await queueRef.current.draining;
    }
  }, [drain]);

  const clearAutosaveTimer = useCallback(() => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
  }, []);

  // 입력 변경 후 1s debounce autosave (미저장 변경 + 비제출 + 비완료 + 비freeze 일 때만).
  // dirty=rev>savedRev — 저장 성공(SAVED) 후 rev===savedRev 가 되어 루프가 멈춘다(codex P2).
  useEffect(() => {
    if (!dirty || state.submitting || state.result || frozenRef.current) return;
    autosaveTimerRef.current = setTimeout(
      () => scheduleSave(formRef.current, stepRef.current, revRef.current),
      1000,
    );
    return () => clearAutosaveTimer();
  }, [dirty, state.rev, state.submitting, state.result, scheduleSave, clearAutosaveTimer]);

  // ── 실시간 중복검사 (3 필드) ──
  const normSlug = useCallback((v: string) => {
    const r = validateSlugFormat(v);
    return r.ok ? r.slug : null;
  }, []);
  const normBiz = useCallback((v: string) => normalizeBusinessNumber(v), []);
  const normEmail = useCallback((v: string) => {
    const e = v.trim().toLowerCase();
    return z.string().email().safeParse(e).success ? e : null;
  }, []);

  const domainCheck = useAvailabilityCheck(state.form.slug, normSlug, checkDomainAction);
  const businessCheck = useAvailabilityCheck(
    state.form.company.business_number,
    normBiz,
    checkBusinessNumberAction,
  );
  const adminEmailCheck = useAvailabilityCheck(state.form.admin.email, normEmail, checkAdminEmailAction);

  const asyncAvail = useMemo(
    () => ({
      domain: confirmed(domainCheck, normSlug(state.form.slug)),
      business: confirmed(businessCheck, normBiz(state.form.company.business_number)),
      adminEmail: confirmed(adminEmailCheck, normEmail(state.form.admin.email)),
    }),
    [domainCheck, businessCheck, adminEmailCheck, state.form, normSlug, normBiz, normEmail],
  );
  const asyncAvailRef = useRef(asyncAvail);
  asyncAvailRef.current = asyncAvail;

  const currentKey = STEP_KEYS[state.step];
  // plan_id 는 fetched 목록에 속한 것만 — 복원 draft/변조 plan_id 를 client 에서 차단(codex P2, RPC 재검증 부재 보완).
  const planAllowed = plans.some((p) => p.id === state.form.plan.plan_id);
  const allAsyncOk = asyncAvail.domain && asyncAvail.business && asyncAvail.adminEmail;
  const needsPlan = state.step >= STEP_KEYS.indexOf('plan');
  // review 단계는 전체 schema 외 async 중복검사도 다시 강제(Stepper 재진입으로 slug/email 변경 후 stale 통과 차단, codex P3).
  const currentComplete =
    isStepComplete(currentKey, state.form, asyncAvail) &&
    (!needsPlan || planAllowed) &&
    (currentKey !== 'review' || allAsyncOk);

  // ── 네비게이션 ──
  const navigate = useCallback(
    async (target: number) => {
      if (dirty && !state.submitting && !state.result && !frozenRef.current) {
        clearAutosaveTimer();
        scheduleSave(formRef.current, stepRef.current, revRef.current);
        await flushSaves();
      }
      dispatch({ type: 'SET_STEP', step: target });
      if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
    },
    [dirty, state.submitting, state.result, clearAutosaveTimer, scheduleSave, flushSaves],
  );

  const submit = useCallback(async () => {
    const v = validateFullPayload(formRef.current);
    // 제출 게이트 재확인: schema + plan 화이트리스트 + async 중복검사 모두 통과해야 함(codex P2/P3).
    if (
      !v.ok ||
      !plans.some((p) => p.id === formRef.current.plan.plan_id) ||
      !(asyncAvailRef.current.domain && asyncAvailRef.current.business && asyncAvailRef.current.adminEmail)
    ) {
      dispatch({ type: 'SET_STEP', step: STEP_KEYS.indexOf('review') });
      dispatch({ type: 'SUBMIT_ERROR', error: 'invalid' });
      return;
    }
    frozenRef.current = true; // 신규 저장 hard-stop
    clearAutosaveTimer();
    dispatch({ type: 'BEGIN_SUBMIT' });
    await flushSaves(); // in-flight 저장 drain (제출 전 draft 최신화)

    const adminEmails = [
      { email: formRef.current.admin.email.trim().toLowerCase(), role: 'tenant_super' },
      ...formRef.current.additional_admins.map((a) => ({
        email: a.email.trim().toLowerCase(),
        role: 'tenant_hr_admin',
      })),
    ];

    const res = await registerTenantAction({
      draft_id: draftIdRef.current ?? undefined,
      idempotency_key: idempotencyKey,
      payload: buildRegistrationPayload(formRef.current),
    });

    if (res.ok) {
      const result: RegisterResult = {
        tenantId: res.tenantId,
        draftId: res.draftId,
        alreadyCompleted: res.alreadyCompleted,
        invitations: res.invitations,
        urlsUnavailable: res.alreadyCompleted,
        adminEmails,
      };
      try {
        sessionStorage.setItem(
          RECOVERY_KEY,
          JSON.stringify({ tenantId: res.tenantId, draftId: res.draftId, adminEmails }),
        );
      } catch {
        /* sessionStorage 불가(프라이빗 모드 등) — 메모리 결과로 충분 */
      }
      dispatch({ type: 'SUBMIT_SUCCESS', result });
    } else {
      frozenRef.current = false; // 실패 → 재시도 위해 저장 재개
      dispatch({ type: 'SUBMIT_ERROR', error: res.error });
    }
  }, [clearAutosaveTimer, flushSaves, idempotencyKey, plans]);

  // 새로고침 후 직전 완료 복구(열린 draft 없음 + sessionStorage recovery) → URL 없는 완료 상태.
  useEffect(() => {
    if (initialDraft || state.result) return;
    try {
      const raw = sessionStorage.getItem(RECOVERY_KEY);
      if (!raw) return;
      const rec = JSON.parse(raw) as {
        tenantId: string;
        draftId: string;
        adminEmails: { email: string; role: string }[];
      };
      if (rec?.tenantId) {
        dispatch({
          type: 'SUBMIT_SUCCESS',
          result: {
            tenantId: rec.tenantId,
            draftId: rec.draftId,
            alreadyCompleted: true,
            invitations: [],
            urlsUnavailable: true,
            adminEmails: rec.adminEmails ?? [],
          },
        });
      }
    } catch {
      /* 손상된 recovery 무시 */
    }
    // 최초 mount 1회.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startNew = useCallback(() => {
    try {
      sessionStorage.removeItem(RECOVERY_KEY);
    } catch {
      /* noop */
    }
    frozenRef.current = false;
    draftIdRef.current = null;
    setIdempotencyKey(globalThis.crypto.randomUUID()); // 새 등록은 새 멱등키(evaluator P2 — 직전 키 재사용 차단).
    dispatch({ type: 'RESET' });
  }, []);

  // 성공 화면.
  if (state.result) {
    return (
      <SuccessPanel
        result={state.result}
        onResend={(email) => sendInviteAction(state.result!.tenantId, email)}
        onStartNew={startNew}
      />
    );
  }

  const selectedPlan = plans.find((p) => p.id === state.form.plan.plan_id) ?? null;
  const steps = STEP_KEYS.map((k) => ({ label: t(`steps.${k}`) }));

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr]">
      <aside className="md:sticky md:top-4 md:self-start">
        <div className="rounded-lg border border-border bg-bg">
          <Stepper
            steps={steps}
            currentIndex={state.step}
            isStepEnabled={(i) => i <= state.highestReached}
            onStepClick={(i) => void navigate(i)}
          />
        </div>
      </aside>

      <section className="min-w-0">
        <div className="mb-2 flex min-h-4 justify-end">
          {showSaved && <span className="text-[12px] text-text-muted">{t('nav.autosaved')}</span>}
        </div>
        {renderStep(currentKey, {
          t,
          form: state.form,
          update,
          plans,
          selectedPlan,
          domainCheck,
          businessCheck,
          adminEmailCheck,
        })}

        {state.submitError && (
          <Alert variant="danger" className="mt-4">
            {t(`error.${state.submitError}`)}
          </Alert>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <Button
            type="button"
            variant="ghost"
            disabled={state.step === 0 || state.submitting}
            onClick={() => void navigate(state.step - 1)}
          >
            {t('nav.prev')}
          </Button>

          {currentKey === 'review' ? (
            <Button
              type="button"
              variant="primary"
              disabled={!currentComplete || state.submitting}
              onClick={() => void submit()}
            >
              {state.submitting ? t('nav.submitting') : t('nav.submit')}
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              disabled={!currentComplete || state.submitting}
              onClick={() => void navigate(state.step + 1)}
            >
              {t('nav.next')}
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}

export interface StepProps {
  t: ReturnType<typeof useTranslations>;
  form: WizardForm;
  update: (updater: (f: WizardForm) => WizardForm) => void;
  plans: PlanOption[];
  selectedPlan: PlanOption | null;
  domainCheck: CheckSnapshot;
  businessCheck: CheckSnapshot;
  adminEmailCheck: CheckSnapshot;
}

function renderStep(key: StepKey, props: StepProps) {
  switch (key) {
    case 'company':
      return <StepCompany {...props} />;
    case 'domain':
      return <StepDomain {...props} />;
    case 'plan':
      return <StepPlan {...props} />;
    case 'admin':
      return <StepAdmin {...props} />;
    case 'modules':
      return <StepModules {...props} />;
    case 'initial_data':
      return <StepInitialData {...props} />;
    case 'review':
      return <StepReview {...props} />;
    default:
      return null;
  }
}
