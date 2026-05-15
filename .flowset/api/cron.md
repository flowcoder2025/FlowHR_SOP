# 자동 작업 (Cron / Edge Function)

> Supabase Edge Function + pg_cron 또는 외부 스케줄러. 클라이언트 노출 없음. 모든 작업은 `audit_logs` 또는 전용 로그 테이블 INSERT.

## 1. 일간 작업

### 23:59 — 근태 누락 자동 처리 (KI-001 관련 + ST-035)
```sql
-- pg_cron 또는 Edge Function (Supabase Scheduled)
-- 출근 기록은 있고 퇴근 없는 행을 status=missing으로 전환
UPDATE attendances
SET status = 'missing', updated_at = now()
WHERE work_date = (CURRENT_DATE - INTERVAL '1 day')
  AND clock_in_at IS NOT NULL
  AND clock_out_at IS NULL
  AND status NOT IN ('leave', 'missing', 'modification_pending', 'modification_done');

-- 누락된 직원에게 알림
INSERT INTO notifications (tenant_id, user_id, type, title, message, link_url)
SELECT a.tenant_id, e.user_id, 'system',
       '어제 퇴근 기록 누락', '근태 수정 요청을 진행해주세요.',
       '/me/attendance?date=' || (CURRENT_DATE - 1)
FROM attendances a JOIN employees e ON e.id = a.employee_id
WHERE a.status = 'missing' AND a.updated_at >= (now() - INTERVAL '5 minutes');
```

**감사**: `attendance.auto_marked_missing` action × N건.

### 03:00 (일요일) — 자동 백업
- Supabase Pro PITR 외 추가 영구 백업
- `backup_jobs` INSERT (kind='auto', status='running')
- pg_dump → S3 archive (분기 1회 영구 보관)
- 완료 시 운영사 알림

### 09:00 — 휴가 만료 임박 알림
```sql
-- 만료 30일 전 / 7일 전 직원에게 알림
INSERT INTO notifications (...)
SELECT lb.tenant_id, e.user_id, 'system', '연차 소멸 임박', '잔여 ' || lb.remaining || '일이 소멸됩니다.', ...
FROM leave_balances lb JOIN employees e ON e.id = lb.employee_id
WHERE lb.remaining > 0
  AND lb.expires_at IN (CURRENT_DATE + INTERVAL '30 days', CURRENT_DATE + INTERVAL '7 days');
```

### 회계연도 시작일 — 휴가 자동 부여
```sql
-- 회사 설정 (tenant_settings.leave_policy.year_start)에 따라
-- 입사일 기준 또는 회계연도 기준으로 연차 자동 부여
-- 신규 leave_balances INSERT
```

### 만료일 도래 — 휴가 자동 차감
```sql
UPDATE leave_balances SET remaining = 0, used = granted WHERE expires_at < CURRENT_DATE;
```

## 2. 시간 단위 작업

### 매시 정각 — 결재 SLA 임박 알림 (KI-003 해소)
```sql
-- tenant_settings.approval_sla 또는 기본값 사용
-- 단계별 SLA (휴가 4h, 근태수정 24h, 증명서 24h, 정보변경 24h)
-- 임박 (남은 시간 < 30분) 시 결재자에게 알림

WITH pending_steps AS (
  SELECT as_step.id, as_step.approver_id, a.request_type, a.tenant_id,
    a.requested_at + COALESCE(
      (ts.value::jsonb -> a.request_type ->> 'sla_hours')::int * INTERVAL '1 hour',
      INTERVAL '4 hour'  -- 기본 4시간
    ) AS sla_deadline
  FROM approval_steps as_step
  JOIN approvals a ON a.id = as_step.approval_id
  LEFT JOIN tenant_settings ts ON ts.tenant_id = a.tenant_id
  WHERE as_step.status = 'pending'
    AND as_step.created_at > (now() - INTERVAL '48 hours')  -- 48시간 이상 경과는 별도 처리
)
INSERT INTO notifications (tenant_id, user_id, type, title, message, link_url)
SELECT ps.tenant_id, e.user_id, 'approval', 'SLA 임박', '결재 마감 30분 전입니다.',
       '/tenant/approvals/inbox'
FROM pending_steps ps JOIN employees e ON e.id = ps.approver_id
WHERE ps.sla_deadline BETWEEN now() AND (now() + INTERVAL '30 minutes')
ON CONFLICT DO NOTHING;
```

추가 외부 채널: 카카오 알림톡 / SMS (회사 설정 우선순위).

### 매시 — 티켓 SLA 임박 알림 (KI-001 해소)
```sql
-- tickets.priority별 SLA: p0=30분, p1=2h, p2=24h, p3=72h
WITH open_tickets AS (
  SELECT id, assigned_to, tenant_id, priority, created_at +
    CASE priority
      WHEN 'p0' THEN INTERVAL '30 minutes'
      WHEN 'p1' THEN INTERVAL '2 hours'
      WHEN 'p2' THEN INTERVAL '24 hours'
      WHEN 'p3' THEN INTERVAL '72 hours'
    END AS sla_deadline
  FROM tickets WHERE status IN ('open', 'in_progress', 'waiting_user')
)
SELECT * FROM open_tickets WHERE sla_deadline BETWEEN now() AND (now() + INTERVAL '15 minutes');
-- 임박 알림 발송 + audit_logs ticket.sla_warning
```

### 매시 — 문서 미열람 재발송 (TA-10)
```sql
-- 발송 후 24h / 7d 미열람 — 카카오 알림톡 폴백
WITH unread_payslips AS (
  SELECT d.id, d.tenant_id, d.owner_id
  FROM documents d
  WHERE d.sub_type = 'payslip' AND d.status IN ('sent', 'created')
    AND d.sent_at < (now() - INTERVAL '24 hours')
    AND (d.last_resent_at IS NULL OR d.last_resent_at < (now() - INTERVAL '6 days'))
)
-- 카카오 알림톡 발송 + d.last_resent_at 갱신
```

## 3. 월간 작업

### 매월 1일 00:00 — 청구 일괄 발행 (ST-012)
```typescript
// Edge Function (Supabase Scheduled Functions)
async function batchIssueInvoices() {
  const tenants = await sb.from('tenants').select('*').eq('status', 'active');
  for (const t of tenants) {
    const sub = await sb.from('subscriptions').select('*').eq('tenant_id', t.id).single();
    const activeCount = await countActiveEmployees(t.id);
    const subtotal = sub.latched_base_price + sub.latched_price_per_user * Math.max(activeCount - sub.included_users, 0);
    const tax = Math.floor(subtotal * 0.1);
    await sb.from('invoices').insert({
      tenant_id: t.id,
      subscription_id: sub.id,
      invoice_number: generateInvoiceNumber(),
      period_month: currentMonth(),
      active_users: activeCount,
      subtotal_krw: subtotal,
      tax_krw: tax,
      total_krw: subtotal + tax,
      status: 'issued',
      issued_at: today(),
      due_date: addDays(today(), 14),
    });
    // 테넌트 관리자에게 알림 + 이메일
  }
}
```

### 매월 16일 — 미납 자동 전환 (ST-014)
```sql
UPDATE invoices SET status = 'overdue' WHERE status = 'issued' AND due_date < CURRENT_DATE;
-- 운영사 + 테넌트 관리자에게 알림
```

## 4. 즉시 (이벤트 트리거)

### 결재 단계 진행 시 다음 결재자 알림
- DB after-trigger `approvals.status` UPDATE
- 또는 Edge Function이 결재 처리 API에서 명시 호출
- Realtime broadcast + 인앱 알림 + (30분 미열람 시) 카카오 알림톡

### 테넌트 비활성화 시 활성 세션 종료
- Edge Function: tenants.status='inactive' UPDATE 후
- 해당 테넌트 user 모두에게 `realtime:user:force_logout` broadcast
- 클라이언트가 인지 → 즉시 로그아웃 + 로그인 페이지

## 5. 운영 모니터링

| Job | 마지막 실행 시각 | 성공률 (7일) | 평균 소요 시간 |
|-----|--------------|------------|-------------|
| 매일 23:59 누락 처리 | (운영 대시보드) | — | ≤ 30s |
| 매시 SLA 임박 | — | — | ≤ 10s |
| 매월 1일 청구 발행 | — | — | ≤ 5min (100 테넌트) |

운영사 OP-11 시스템 설정 > 자동 작업 탭에서 상태 모니터링 (v1.1).

## 6. 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-15 | 초안 — 일/시/월 단위 자동 작업 + KI-001/003 해소 | Phase 4 진입 |
