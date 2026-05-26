# 05. 비기능 요구사항 (NFR)

## 1. 성능 (Performance)

| 항목 | 기준 | 측정 방법 |
|------|------|---------|
| First Contentful Paint (FCP) | ≤ 1.5s (4G) | Lighthouse, RUM (Real User Monitoring) |
| Largest Contentful Paint (LCP) | ≤ 2.5s | Lighthouse, RUM |
| Time to Interactive (TTI) | ≤ 3.5s | Lighthouse |
| API 응답 (p95) | ≤ 500ms | Supabase 로그 + Sentry 성능 |
| API 응답 (p99) | ≤ 1.5s | 동상 |
| 출퇴근 클릭 → 기록 완료 | ≤ 800ms (느린 모바일 LTE 기준) | E2E 측정 |
| 로그인 → 대시보드 진입 | ≤ 2s | E2E 측정 |
| 대시보드 KPI 카드 렌더 | ≤ 1s | Lighthouse |
| 페이지네이션 전환 | ≤ 300ms (캐시 히트 시) | RUM |
| 1000명 직원 목록 조회 | ≤ 1s (페이지네이션 적용) | 부하 테스트 |
| 동시 접속 (테넌트당) | 500명 | 부하 테스트 |

## 2. 가용성 (Availability)

| 항목 | 기준 |
|------|------|
| 월간 가용성 (SLO) | Free 단계: 99.5% best-effort (SLA 없음, 월 약 3.6시간 다운 허용) / Pro 전환 후: 99.9% 보장 (Supabase Pro SLA — `07-risks.md` R-08) |
| 계획 점검 사전 공지 | 7일 전 |
| 응급 점검 시간 제한 | 30분 / 회 |
| 점검 시간대 | 토 02:00 ~ 토 06:00 (KST) |

## 3. 보안 (Security)

### 3-1. 인증
- Supabase Auth (이메일 + 비밀번호) + 선택 2FA (TOTP)
- 비밀번호 정책: 최소 10자 + 영문 대소문자 + 숫자 + 특수문자 1개 이상
- 잘못된 로그인 5회 → 5분 잠금 (IP 기반)
- 세션 만료: 30일 (자동 갱신), 비활성 24시간 시 재로그인
- 운영사 계정은 2FA 강제

### 3-2. 권한 / RLS
- 모든 도메인 테이블 RLS 활성화 (`alter table ... enable row level security`)
- RLS 미적용 테이블 0개 (Phase 7 Stop 게이트)
- 운영사 우회 권한은 `operator_super`, `operator_staff` role만
- API Route Handler / Edge Function에서도 권한 재검증 (defense in depth)

### 3-3. 데이터 보호
- 전송: TLS 1.3 (Vercel + Supabase 기본)
- 저장: Postgres TDE는 Supabase Pro 이상 (MVP 후순위)
- 비밀번호: bcrypt (Supabase 기본)
- PII 필드(주민번호·계좌): 컬럼 단위 암호화 (pgcrypto) 또는 Supabase Vault
- 파일: Storage 객체별 Signed URL (15분 만료)

### 3-4. OWASP Top 10 대응
| 위협 | 대응 |
|------|------|
| Injection | Supabase SDK 매개변수 바인딩 강제, raw SQL 금지 |
| Broken Auth | Supabase Auth + 2FA + 잠금 정책 |
| Sensitive Data Exposure | 위 §3-3 |
| XXE | XML 미사용 |
| Broken Access Control | RLS + 서버 권한 재검증 |
| Security Misconfig | Vercel 환경변수 분리, `NEXT_PUBLIC_*` 외 노출 금지 |
| XSS | React 자동 escape, `dangerouslySetInnerHTML` 금지 |
| Insecure Deserialization | JSON만, eval 금지 |
| 알려진 취약점 | `pnpm audit` 주간 + Dependabot |
| 부족한 로깅 | audit_logs 전수 기록 |

### 3-5. 컴플라이언스
- 개인정보보호법 (PIPA): 개인정보 수집·이용 동의, 보관기간 명시, 파기 절차
- 근로기준법: 근로시간 기록 의무, 임금명세서 교부 의무 (2021 개정)
- 전자서명법: 전자계약 도입 시 적용 (MVP 후순위)

## 4. 접근성 (Accessibility)

- 기준: WCAG 2.1 AA
- 명도 대비: 본문 4.5:1, 큰 텍스트 3:1
- 키보드 네비게이션: 모든 인터랙티브 요소 Tab 접근, focus ring 가시
- 스크린리더: ARIA 라벨 모든 버튼/링크/폼, 라이브 영역 적절히
- 폼: 라벨 명시, 에러 메시지 `aria-describedby` 연결
- 이미지: `alt` 속성 의무, 장식 이미지는 `alt=""`
- 색상 단독 의미 전달 금지 (배지에 텍스트 병기)

## 5. 국제화 (i18n)

| 항목 | MVP | 후순위 |
|------|----|--------|
| 언어 | 한국어 only | 영어 (글로벌 진출 시) |
| 라이브러리 | next-intl 3.x | 동일 |
| 날짜/숫자 포맷 | `Intl.DateTimeFormat`, `Intl.NumberFormat` ko-KR | en-US 추가 |
| 통화 | KRW | USD 추가 |
| 시간대 | Asia/Seoul 고정 (MVP) | 사용자별 timezone 설정 |

## 6. 감사 / 로깅

### 6-1. audit_logs 기록 대상
- 모든 INSERT/UPDATE/DELETE on 핵심 테이블 (employees, leaves, approvals, documents, attendances)
- 모든 APPROVE/REJECT/CANCEL 액션
- 로그인 / 로그아웃 / 비밀번호 변경 / 2FA 활성화-비활성화
- 권한 변경 / 직원 상태 변경 / 테넌트 설정 변경

### 6-2. audit_logs 스키마 (요약)
```
audit_logs (
  id, tenant_id, actor_id, actor_role, action, target_type, target_id,
  before jsonb, after jsonb, ip, user_agent, request_id, created_at
)
```

### 6-3. 보관 기간
- audit_logs: 5년 (노동법 권고 + 사용자 요청 시 연장)
- attendances: 영구 (퇴사 후 5년 보관 의무 — 근로기준법 §42)
- 결재/문서: 영구
- 알림: 90일 (이후 자동 삭제)

## 7. 백업 / 복구

> **단계별 적용** (`guardrails.md §10` SSOT — Free 시작 + Pro 전환 5트리거). 아래 PITR/RPO 1시간 기준은 **Pro 전환 후(트리거 도달 시)** 목표. 개발/초기 베타 단계(Free)는 일 1회 자동 백업 + 주 1회 `pg_dump` cron으로 운영.

| 항목 | Free 단계 (트리거 도달 전) | Pro 전환 후 (목표) |
|------|------------------------|------------------|
| RPO (Recovery Point Objective) | 24시간 (자동 백업 1회) + 주 1회 pg_dump | **1시간 (Supabase PITR, Pro+)** |
| RTO (Recovery Time Objective) | 8시간 (수동 복구) | 4시간 |
| 백업 주기 | 자동 일 1회 (Supabase Free 기본) + 주 1회 pg_dump cron | 자동 일 1회 + PITR 7일 |
| 백업 보관 | 7일 (Free 자동) | 30일 (자동) + 분기 1회 영구 보관 (S3 archive) |
| 복구 테스트 | 트리거 도달 시 도입 | 분기 1회 staging 환경에서 |

## 8. 확장성 (Scalability)

| 시나리오 | 대응 |
|---------|------|
| 1 테넌트당 직원 1만명 | 페이지네이션 + 인덱스. Phase 3에서 검증 |
| 1 테넌트당 일일 출퇴근 1만건 | `attendances` 파티셔닝 (월 단위) — MVP 후순위 |
| 동시 접속 1만명 | Vercel Edge + Supabase Pro pool (기술 목표). **Free 단계는 동시 접속 ~60 한도 — Connection 위험 신호 시 Pro pool 전환** (`guardrails.md §10` 트리거 4). 1인+2~3사 컨텍스트(150 MAU)에서는 영구 미도달 가능 |
| 100 테넌트 동시 운영 | 단일 DB로 충분, 200 테넌트 초과 시 sharding 검토 |

## 9. 모니터링 / 알림

| 항목 | 도구 | 임계 |
|------|------|------|
| 에러 추적 | Sentry | p95 에러율 ≥ 1% 시 알림 |
| 성능 추적 | Sentry Performance | p95 ≥ 2s 시 알림 |
| Uptime | UptimeRobot 또는 Better Uptime | 5분 다운 시 알림 |
| DB 모니터링 | Supabase Dashboard | CPU 80%, Connection 80% 시 알림 |
| 로그 | Axiom 또는 Supabase Logs | ERROR 레벨 즉시 |
| 비즈니스 지표 | 자체 대시보드 (OP-10) | 일일 가입/해지 / MRR |

## 10. 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-15 | 초안 — 10 NFR 영역 | Phase 1 진입 |
