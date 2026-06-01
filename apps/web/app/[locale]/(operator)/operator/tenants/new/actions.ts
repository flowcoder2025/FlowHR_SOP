'use server';

import {
  checkAdminEmail,
  checkBusinessNumber,
  checkDomain,
} from '@/lib/operator/tenant-registration/queries';
import {
  type DraftSaveResult,
  type RegisterTenantResult,
  type SendInviteResult,
  registerTenant as registerTenantBase,
  saveDraft as saveDraftBase,
  sendInvite as sendInviteBase,
} from '@/lib/operator/tenant-registration/actions';
import type { CheckResult } from '@/lib/operator/tenant-registration/queries';

/**
 * OP-04 7단계 마법사 — route-local 서버 액션 표면 (WI-036).
 *
 * 클라이언트 마법사는 이 파일만 import 한다. `queries.ts` 는 server-only 라 client 직접 import 불가 →
 * 실시간 검증(check-domain/business/admin-email)은 얇은 'use server' wrapper 로 경유한다.
 * saveDraft/deleteDraft/registerTenant/sendInvite 는 이미 'use server'(lib/actions.ts) 지만 화면이
 * 단일 표면(./actions)만 의존하도록 재export 한다.
 */

export async function checkDomainAction(slug: string): Promise<CheckResult> {
  return checkDomain(slug);
}

export async function checkBusinessNumberAction(value: string): Promise<CheckResult> {
  return checkBusinessNumber(value);
}

export async function checkAdminEmailAction(email: string): Promise<CheckResult> {
  return checkAdminEmail(email);
}

export async function saveDraftAction(input: unknown): Promise<DraftSaveResult> {
  return saveDraftBase(input);
}

export async function registerTenantAction(input: unknown): Promise<RegisterTenantResult> {
  return registerTenantBase(input);
}

export async function sendInviteAction(tenantId: string, email?: string): Promise<SendInviteResult> {
  return sendInviteBase(tenantId, email);
}
