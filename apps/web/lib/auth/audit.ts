import 'server-only';
import { createServiceRoleClient } from '@flowhr/api-client/server';

type AuditResult = 'success' | 'failed' | 'denied';

export interface AuthAuditInput {
  action:
    | 'auth.login'
    | 'auth.login_failed'
    | 'auth.locked'
    | 'auth.password_reset_requested'
    | 'auth.password_reset'
    | 'auth.2fa_enabled'
    | 'auth.2fa_disabled'
    | 'auth.2fa_verified'
    | 'auth.2fa_failed'
    | 'auth.recovery_code_used';
  result: AuditResult;
  actorId?: string | null;
  actorRole?: string | null;
  tenantId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

/**
 * 인증 이벤트 감사 로그 기록 (audit_logs INSERT, service_role).
 * 감사 실패가 로그인 흐름을 막지 않도록 호출부에서 best-effort 처리한다 (api/auth.md §Audit).
 */
export async function writeAuthAudit(input: AuthAuditInput): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from('audit_logs').insert({
    action: input.action,
    result: input.result,
    actor_id: input.actorId ?? null,
    actor_role: input.actorRole ?? null,
    tenant_id: input.tenantId ?? null,
    ip: input.ip ?? null,
    user_agent: input.userAgent ?? null,
  });
  if (error) throw error;
}
