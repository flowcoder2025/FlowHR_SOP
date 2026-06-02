import { z } from 'zod';

/**
 * OP-02 테넌트 목록 — 순수 헬퍼/타입 (WI-037, 서버 의존 없음 → 단위 테스트).
 * SSOT: .flowset/api/operator.md OP-02 + analysis/OP-02.md + codex 3R 협의(thread 019e86f6).
 *
 * 표시상태(displayStatus)는 DB status(active 고정 가능)를 read-side 파생한다(KI-123).
 * enum 무변경(WI-035 결정) — scheduled/pending_invite 는 DB 컬럼이 아니라 파생 표시값.
 */

// ── 상태 ─────────────────────────────────────────────────────────────────────
export const TENANT_STATUSES = [
  'active',
  'inactive',
  'overdue',
  'expiring_soon',
  'expired',
  'archived',
] as const;
export type TenantStatus = (typeof TENANT_STATUSES)[number];

/** 파생 표시상태 — DB status + onboarding/scheduled 파생값. */
export type DisplayStatus = TenantStatus | 'pending_invite' | 'scheduled';

/** 수동 상태변경 가능 대상(ST-009) — billing 파생상태(overdue/expiring_soon)·archived 제외. */
export const MANUAL_STATUS_TARGETS = ['active', 'inactive', 'expired'] as const;
export type ManualStatusTarget = (typeof MANUAL_STATUS_TARGETS)[number];

export const INVOICE_STATUSES = [
  'draft',
  'issued',
  'paid',
  'overdue',
  'failed',
  'refunded',
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

// ── 정렬 ─────────────────────────────────────────────────────────────────────
/** DB 컬럼 기준 정렬만(파생 displayStatus 정렬 불가, codex 권고). */
export const SORT_FIELDS = [
  'name',
  'status',
  'plan_id',
  'active_user_count',
  'created_at',
  'updated_at',
] as const;
export type SortField = (typeof SORT_FIELDS)[number];

export const DEFAULT_SORT_FIELD: SortField = 'updated_at';
export const DEFAULT_SORT_DIRECTION = 'desc' as const;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
/** 내보내기 상한(과도한 메모리/CSV 방지 — 초과분은 잘림을 명시). */
export const EXPORT_LIMIT = 1000;

// ── 입력 파라미터 ───────────────────────────────────────────────────────────
export interface ListParams {
  q: string;
  /** DB status 필터(다중). 빈 배열이면 전체. */
  status: TenantStatus[];
  /** plan_id 필터(다중). 빈 배열이면 전체. */
  planId: string[];
  sortField: SortField;
  sortDirection: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

const uuidSchema = z.string().uuid();

function toArray(v: string | string[] | undefined): string[] {
  if (v == null) return [];
  const raw = Array.isArray(v) ? v : [v];
  // 콤마 분리 + 공백 제거 + 빈값 제거.
  return raw
    .flatMap((s) => s.split(','))
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * URL searchParams → 정규화된 ListParams. 잘못된 값은 조용히 기본값으로 보정(목록 화면은 fail-soft).
 */
export function parseListParams(
  sp: Record<string, string | string[] | undefined>,
): ListParams {
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q ?? '').trim().slice(0, 100);

  const status = toArray(sp.status).filter((s): s is TenantStatus =>
    (TENANT_STATUSES as readonly string[]).includes(s),
  );
  const planId = toArray(sp.plan).filter((s) => uuidSchema.safeParse(s).success);

  const sortRaw = Array.isArray(sp.sort) ? sp.sort[0] : sp.sort;
  const dirRaw = Array.isArray(sp.dir) ? sp.dir[0] : sp.dir;
  const sortField = (SORT_FIELDS as readonly string[]).includes(sortRaw ?? '')
    ? (sortRaw as SortField)
    : DEFAULT_SORT_FIELD;
  const sortDirection = dirRaw === 'asc' || dirRaw === 'desc' ? dirRaw : DEFAULT_SORT_DIRECTION;

  const pageRaw = Number(Array.isArray(sp.page) ? sp.page[0] : sp.page);
  const page = Number.isInteger(pageRaw) && pageRaw >= 1 ? pageRaw : 1;

  const sizeRaw = Number(Array.isArray(sp.pageSize) ? sp.pageSize[0] : sp.pageSize);
  const pageSize =
    Number.isInteger(sizeRaw) && sizeRaw >= 1 && sizeRaw <= MAX_PAGE_SIZE
      ? sizeRaw
      : DEFAULT_PAGE_SIZE;

  return { q, status, planId, sortField, sortDirection, page, pageSize };
}

/**
 * 검색어 sanitize — PostgREST `.or()`/`.ilike()` 메타문자(콤마/괄호/별표/퍼센트/역슬래시) 제거로
 * 필터 주입과 패턴 깨짐을 방지. 결과가 빈 문자열이면 호출측이 검색을 생략한다.
 */
export function sanitizeSearchTerm(raw: string): string {
  return raw.replace(/[,()*%\\]/g, ' ').trim().slice(0, 100);
}

// ── 표시상태 파생(KI-123) ─────────────────────────────────────────────────────
export interface DeriveStatusInput {
  status: TenantStatus;
  adminUserId: string | null;
  hasPendingAdminInvite: boolean;
  contractStartDate: string | null; // 'YYYY-MM-DD'
  /** 기준 오늘(KST 'YYYY-MM-DD') — 호출측에서 주입(테스트 가능). */
  today: string;
}

/**
 * 표시상태 파생 우선순위(codex 3R 확정):
 *  1) DB status !== 'active' → DB status 그대로(운영/billing 상태 우선)
 *  2) 관리자 미활성(admin_user_id NULL) + 대표 pending 초대 존재 → pending_invite
 *  3) 계약 시작일 > 오늘(KST) → scheduled
 *  4) else active
 */
export function deriveDisplayStatus(input: DeriveStatusInput): DisplayStatus {
  if (input.status !== 'active') return input.status;
  if (input.adminUserId == null && input.hasPendingAdminInvite) return 'pending_invite';
  if (input.contractStartDate != null && input.contractStartDate > input.today) return 'scheduled';
  return 'active';
}

// ── 상태 전이 검증(ST-009) ────────────────────────────────────────────────────
/**
 * 수동 상태변경 허용 전이. target 은 항상 {active,inactive,expired}.
 *  - archived 는 변경 불가(terminal, WI-037 범위 외)
 *  - overdue/expiring_soon(billing 자동상태)에서의 수동 정리도 허용(reason 필수는 액션이 강제)
 */
const ALLOWED_TRANSITIONS: Record<TenantStatus, ReadonlySet<ManualStatusTarget>> = {
  active: new Set(['inactive', 'expired']),
  inactive: new Set(['active', 'expired']),
  expired: new Set(['active', 'inactive']),
  overdue: new Set(['active', 'inactive', 'expired']),
  expiring_soon: new Set(['active', 'inactive', 'expired']),
  archived: new Set(),
};

export function isManualStatusTarget(v: unknown): v is ManualStatusTarget {
  return typeof v === 'string' && (MANUAL_STATUS_TARGETS as readonly string[]).includes(v);
}

/** from→to 수동 전이 허용 여부. to 는 반드시 MANUAL_STATUS_TARGETS. from===to 는 무변경이라 불허. */
export function isValidStatusTransition(from: TenantStatus, to: ManualStatusTarget): boolean {
  if (from === to) return false;
  return ALLOWED_TRANSITIONS[from]?.has(to) ?? false;
}

/** 현재 status 에서 선택 가능한 수동 전이 target 목록(UI 옵션). */
export function allowedStatusTargets(from: TenantStatus): ManualStatusTarget[] {
  return MANUAL_STATUS_TARGETS.filter((t) => isValidStatusTransition(from, t));
}

// ── 월요금 계산(display-only) ─────────────────────────────────────────────────
export interface MonthlyFeeInput {
  latchedBasePrice: number | null;
  latchedPerUser: number | null;
  activeUserCount: number;
}

/**
 * 월요금 = 기본료(latched_base_price) + 인당요금(latched_price_per_user) × 활성 사용자 수.
 * latched 값이 둘 다 없으면 null(구독 미연결). per-user 모델 표시값(included_users 미반영은 KI).
 */
export function calcMonthlyFeeKrw(input: MonthlyFeeInput): number | null {
  const { latchedBasePrice, latchedPerUser, activeUserCount } = input;
  if (latchedBasePrice == null && latchedPerUser == null) return null;
  const base = latchedBasePrice ?? 0;
  const perUser = (latchedPerUser ?? 0) * Math.max(0, activeUserCount);
  return base + perUser;
}

// ── KST 날짜 ──────────────────────────────────────────────────────────────────
/** Date → KST(UTC+9) 'YYYY-MM-DD'. */
export function kstDateString(d: Date): string {
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

// ── CSV 직렬화 ────────────────────────────────────────────────────────────────
const UTF8_BOM = '﻿';

/** CSV 셀 이스케이프 — 따옴표/콤마/개행/선행수식문자(=,+,-,@) 안전 처리. */
export function csvEscape(value: string | number | null | undefined): string {
  if (value == null) return '';
  let s = String(value);
  // CSV injection 완화: 수식 트리거 문자로 시작하면 앞에 ' 붙임.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * 행렬 → UTF-8 BOM CSV 문자열(Excel 호환). headers 와 rows[i] 길이는 호출측이 맞춘다.
 * CRLF 줄바꿈(Excel 친화).
 */
export function buildCsv(
  headers: string[],
  rows: (string | number | null | undefined)[][],
): string {
  const lines = [headers.map(csvEscape).join(',')];
  for (const row of rows) lines.push(row.map(csvEscape).join(','));
  return UTF8_BOM + lines.join('\r\n');
}
