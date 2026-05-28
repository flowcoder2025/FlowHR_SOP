# WI-019-1-fix 평가 결과 (code 모드)

> 평가자: evaluator (Opus, code 모드, review-rubric.md 4축)
> 일자: 2026-05-28
> 대상 커밋: 31b1dbd (브랜치 fix/WI-019-1-fix-approval-uniques-package-lint)
> 주의: 캐싱 출처 commit SHA가 8d8eb71로 전달됐으나 실제 HEAD는 31b1dbd. 동일 변경으로 확인하고 진행.

---EVAL_RESULT---
PHASE: 7
MODE: code
WI: WI-019-1-fix (WI-019 듀얼검증 P2 정정 — approval/user 1:1 UNIQUE + packages lint 커버리지)
ARTIFACT_PATHS:
  - supabase/migrations/00000000000025_v1_1_wi_019_unique_approval_user_links.sql
  - packages/{api-client,config,i18n,platform,schemas,types,ui}/eslint.config.mjs (7)
  - packages/{api-client,config,i18n,platform,schemas,types,ui}/package.json (lint script)

SCORES:
- 기능 완성도: 9.0 | P2-SCHEMA-002 4개 테이블 전부 approval_id UNIQUE (codex는 attendance_modifications/leaves 2개만 명시했으나 certificate_requests/employee_change_requests까지 확장 — 누락 0, 오히려 thorough). P2-SCHEMA-003 users.employee_id UNIQUE 추가. employees.user_id 이미 UNIQUE 확인(org.sql:24) → 1:1 양방향 성립. nullable + plain UNIQUE 채택으로 NULL 다중 허용(invited 직원/operator-only user) 의도 정확 — NULLS NOT DISTINCT 미사용이 맞음(migration L3 주석 명시). 4개 테이블 approval_id 전부 nullable uuid 확인(attendance L36/leave L16/documents L36/change_requests L11). lint 누락 packages 7개 전부 커버(prior eval은 6개로 undercounting했으나 config 포함 7개 정정).
- 코드 품질: 9.0 | eslint.config.mjs flat config 패턴 정확 — 일반 패키지는 @flowhr/config/eslint-base 재export, config 자신은 ./eslint-base.mjs 상대경로(self-ref 회피, 주석 명시), types는 [{ignores:['src/database.ts']}, ...base] 스프레드로 글로벌 ignore 선행. `--max-warnings=0`로 prior eval 권고(`eslint .`)보다 엄격. 마이그레이션 constraint 5개 명명규칙 일관(uq_<table>_<col>). TODO/FIXME/any 0건(grep EXIT=1). 매직값 없음. on delete set null 시맨틱은 부모 approvals.sql 기존 정책과 일관.
- 테스트 커버리지: 8.0 | code 모드지만 DDL/lint 설정 변경이라 단위테스트 부적용 항목. 검증은 실행 기반: 본 평가자 독립 재현 — turbo run lint --force 8/8 successful(0 cached), turbo run typecheck --force 7/7 successful, turbo run build --force 1/1 successful. database.ts ignore 동작 확인(eslint src/database.ts → ignore 경고). 회귀 가드는 WI-021 phase7-code.yml lint job이 packages 포함하게 됨(prior eval 권고 충족 경로). 생성자 주장 8/8+7/7+PASS 전부 재현 일치.
- 계약 준수: 9.0 | codex P2-SCHEMA-002/003 1:1 매핑 정정(WI-019-020.codex.md L20-21). prior evaluator P2(lint coverage) 권고 정확 이행(WI-019-020.eval.md L45/55/69). 마이그레이션 append-only 정책 준수(file 25, 직전 max 20). 출처 주석 SSOT 명시(migration L1-2). 스코프 경계 정확 — P1-SCHEMA-001(교차테넌트 FK)은 KI-077로 ST-005 Day8 defer(INDEX.md L93, 사용자 결정), P3 UI는 WI-020 소관 — 핸드웨이빙 아님(KI 실제 등록 확인).

WEIGHTED_TOTAL: 8.85/10
  (기능 9.0×0.30 + 품질 9.0×0.25 + 테스트 8.0×0.25 + 계약 9.0×0.20 = 2.70+2.25+2.00+1.80)
THRESHOLD: 8.0 (각 축 최소 7.5)
VERDICT: PASS
P0: 0건
P1: 0건 (KI-077 P1은 본 WI 스코프 외 — 사용자 defer 결정, 본 정정과 무관)

NON_BLOCKING_OBSERVATIONS:
- [P3] supabase/migrations/00000000000025...sql:5-18 — `add constraint` idempotent 가드 없음(Postgres가 ADD CONSTRAINT IF NOT EXISTS 미지원이라 회피 불가, supabase 1회성 추적이라 실무상 무해). 재적용 시 에러나나 정상 마이그레이션 동작. 조치 불요.
- [P3] packages/types/eslint.config.mjs:4 — database.ts ignore가 현 시점엔 load-bearing 아님(--no-ignore로 직접 린트해도 exit 0). 생성파일 회귀 churn 방어용 선제 조치로 합당. 주석 근거 명시됨. 조치 불요.
- [정보] 원격 staging(nwcttwuvdnelfbpjeqzr) 제약 실적용 여부는 SQL 권한 거부로 본 평가자가 직접 미확인. caller 진술 + 빈 staging(비프로덕션) 전제. 로컬 검증 가능 항목(마이그레이션 정확성/충돌 없음/스키마 전제조건)은 전부 확인.

ANTI_PATTERNS_FOUND:
- 없음. (grep TODO/FIXME/any EXIT=1, 매직값 0, 에러 삼킴 무관, RLS는 본 WI 스코프 외 KI-077, 한글 라벨 무관(DDL/config))

ISSUES:
- 차단 이슈 없음.

RECOMMENDATION:
- 승인(PASS). codex P2-SCHEMA-002를 명시된 2개 테이블을 넘어 4개 폴리모픽 1:1 링크 테이블 전부로 확장한 점, lint 커버리지를 prior eval 권고(6개)보다 정확히 7개 전부로 적용한 점이 회의적 검수에도 견고함. nullable+plain UNIQUE 설계 판단 정확.
- (선택) WI-021 phase7-code.yml lint job 도입 시 `apps/**`+`packages/**` path-scope로 본 lint script들이 CI에서 실제 실행되는지 1회 확인 권고.

NEXT_ACTION:
- PASS: 호출자가 .flowset/eval-results/WI-019-1-fix.pass 마커 생성 권장(evaluator는 마커 미생성). codex 결과와 통합 후(review-system.md §4) auto-merge 진행 가능. 본 정정은 codex/evaluator 양측 P2를 해소하므로 통합 시 PASS_BOTH 후보.
---END_EVAL---
