# Phase 4 — API 명세

> SSOT: `.flowset/spec/matrix.json` (37 엔티티 + screens_to_entities_map 36 화면) + `.flowset/db/` (Phase 3 ERD).
> 응답 규약: `.flowset/contracts/api-standard.md`. 데이터 흐름: `.flowset/contracts/data-flow.md`.

## 파일 인덱스

| 파일 | 내용 |
|------|------|
| [conventions.md](conventions.md) | API 응답 규약 확장 + 페이지네이션/필터/정렬/멱등성/인증 |
| [auth.md](auth.md) | CM-01~05 + 2FA + 세션 (Supabase Auth wrapping) |
| [operator.md](operator.md) | OP-01~11 운영사 엔드포인트 (~70개) |
| [tenant.md](tenant.md) | TA-01~14 관리자 엔드포인트 (~120개) |
| [employee.md](employee.md) | EM-01~11 직원 엔드포인트 + Realtime 구독 (~50개) |
| [common.md](common.md) | CM-09~15 공통 인프라 (파일/Excel/PDF/감사/알림 발송) |
| [schemas.md](schemas.md) | 공통 zod 스키마 + envelope + 페이지네이션 + 에러 |
| [cron.md](cron.md) | 자동 작업 (cron / Edge Function) — 누락 처리/만료 알림/SLA 임박/일괄 청구 |

## 형식 정책

- **OpenAPI 3.1 호환 명세**를 마크다운으로 작성 (Phase 7 코드 생성 시 `tsoa` 또는 `zod-to-openapi`로 yaml 변환)
- 각 엔드포인트: 메서드 / 경로 / 인증 / 요청 / 응답 / 에러 / RLS 의존
- 응답은 envelope 형식 (`api-standard.md` §1)
- 모든 페이지네이션은 `page/pageSize/sort/filter` 쿼리
- 멱등성 키: `Idempotency-Key` 헤더 (POST/PATCH)

## 진입 시 동반 KI 해소

| KI | 처리 |
|----|------|
| KI-001 (OP-08 Ticket SLA 트리거) | cron.md SLA 임박 검사 cron 명세 |
| KI-003 (TA-08 결재 SLA) | cron.md 결재 단계별 SLA cron + tenant_settings 정책 매핑 |
| KI-018 (clock_in_location postgis vs jsonb) | **결정**: jsonb `{lat: number, lng: number, accuracy: number}` 채택. Postgres GeoJSON 표준 + GIN 인덱스 없이 1:1 비교만. PostGIS 의존성 회피로 마이그레이션 단순화. |
| KI-019 (approval_lines.conditions zod 스키마) | schemas.md ApprovalLineCondition zod 정의 |

## 핵심 통계 (목표)

- 엔드포인트 수: 약 280개 (운영사 70 + 관리자 120 + 직원 50 + 공통 30 + 인증 10)
- 평균 응답 시간 목표 (p95): ≤ 500ms (PRD §05 NFR)
- Realtime 채널: notifications, approvals, approval_steps, attendances (선택)

## 진행 흐름

| Step | 산출물 | evaluator |
|------|--------|----------|
| 4.0 | README + conventions.md + schemas.md | — |
| 4.1 | auth.md (CM 인증) | — |
| 4.2 | operator.md (OP) | — |
| 4.3 | tenant.md (TA) | — |
| 4.4 | employee.md (EM) | — |
| 4.5 | common.md + cron.md | — |
| 4.6 | 전체 API evaluator (doc 모드) | doc |
