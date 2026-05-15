# 데이터 흐름 계약

> SSOT 데이터 흐름. 어떤 데이터가 어디서 생성되고 어디까지 흐르는지 명시.

## 1. 단일 진실 출처(SSOT) 계층

| 계층 | 역할 | 위치 |
|------|------|------|
| 사용자 요구사항 | 변경 불가 원본 | `.flowset/requirements.md` |
| 화면 명세 | 화면별 UI 명세 | `docs/FlowHR_screen_spec_v_1.md` |
| 데이터 모델 | 엔티티 × CRUD × 권한 | `.flowset/spec/matrix.json` |
| DB 스키마 | Supabase 마이그레이션 | `supabase/migrations/*.sql` |
| 타입 | 자동 생성 | `packages/shared/types/database.ts` (Supabase CLI) |
| API 명세 | OpenAPI | `.flowset/api/openapi.yaml` |
| UI 와이어프레임 | 화면별 컴포넌트 | `.flowset/wireframes/analysis/*.md` |

**규칙**: 하위 계층은 상위 계층에서 파생. 상위 변경 없이 하위만 변경 금지.

## 2. 클라이언트 ↔ 백엔드 데이터 흐름

```
[웹 / PWA / Native App]
   │
   ├─ Supabase Auth (이메일 + 2FA + 세션)
   │     ↓
   ├─ Supabase JS SDK
   │     ↓
   ├─ Row Level Security (RLS) — tenant_id + role 검증
   │     ↓
   ├─ Postgres (단일 스키마, 모든 테이블에 tenant_id)
   │
   └─ Realtime 구독 (알림, 결재 진행)
         ↓
       클라이언트 즉시 갱신
```

## 3. 멀티테넌트 데이터 격리

- 모든 테이블에 `tenant_id uuid not null` (운영사 전용 테이블 제외)
- RLS 정책: `tenant_id = auth.jwt() ->> 'tenant_id'`
- 운영사 화면 접근 시 `role = 'operator_*'` AND `tenant_id IS NULL OR cross_tenant_view = true`

## 4. 파일 / 첨부 흐름

- 업로드: 클라이언트 → Supabase Storage (테넌트별 버킷 또는 prefix `tenants/{tenantId}/`)
- 다운로드: Signed URL (15분 만료)
- 미리보기: 이미지/PDF는 직접 렌더, XLSX/CSV는 서버 변환

## 5. 알림 흐름

```
이벤트 발생 (DB trigger 또는 Edge Function)
   ↓
notifications 테이블 INSERT
   ↓
Realtime broadcast → 클라이언트 알림 배지 갱신
   ↓
(옵션) 카카오 알림톡 / SMS / 푸시(FCM/APNs) 발송
```

## 6. 결재 흐름

```
직원이 신청 (휴가/근태수정/증명서)
   ↓
approvals INSERT + approval_steps 결재선 생성
   ↓
1단계 결재자에게 알림
   ↓
승인 → 다음 단계 / 반려 → 종료
   ↓
최종 승인 시 대상 엔티티 status 갱신 (Leave/Attendance/...)
```

## 7. 감사 로그

- 모든 C/U/D/A 작업은 `audit_logs` INSERT (after-trigger 또는 애플리케이션 레벨)
- 필드: `tenant_id, actor_id, action, target_type, target_id, before, after, ip, request_id, created_at`
- 운영사: `OP-09 감사 로그` 화면에서 전체 조회 (RLS 우회 권한)
- 테넌트: `회사 설정 > 감사 로그` 탭에서 자기 테넌트만 조회

## 8. 캐시 / 무효화

- 클라이언트: React Query (TanStack) `staleTime` 5분, mutation 후 관련 키 invalidate
- 서버: Supabase 자체 캐시 + Edge Function에서 Redis(필요 시) 검토
- Realtime 알림으로 캐시 invalidate 트리거 (결재 처리 등 즉시 반영 필요한 항목)
