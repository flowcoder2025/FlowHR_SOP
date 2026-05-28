# WI-019-1-fix — codex 리뷰 결과

> 출처: codex (gpt-5.5, --read-only) 2026-05-28. read-only 정책으로 에이전트 직접 저장 불가 → Claude가 인라인 결과 기록.
> 대상: 브랜치 fix/WI-019-1-fix-approval-uniques-package-lint, HEAD 31b1dbd (마이그레이션 25 + packages lint).

## verdict: CONDITIONAL — **실질 결함 0건 (P0/P1/P2/P3 모두 0)**

CONDITIONAL 사유는 **커밋 신원 확인뿐** — 자문 프롬프트에 잘못된 SHA(8d8eb71)를 기재해 codex가 해당 커밋을 못 찾음. 실제 HEAD(31b1dbd) 파일 내용은 기술된 변경과 일치 확인. 로컬 turbo lint 8/8 + typecheck 7/7 + build PASS로 신원 조건 충족. → 실질 PASS.

## 통과 확인 항목
- **P2-SCHEMA-002**: approval_id UNIQUE 4테이블 전부 적용 (attendance_modifications/leaves/certificate_requests/employee_change_requests). `approval_steps.approval_id`(다단계 자식)는 UNIQUE 대상 아님 → 올바르게 제외. 누락 테이블 없음.
- **P2-SCHEMA-003**: users.employee_id UNIQUE 가 employees.user_id UNIQUE와 비중복 → 양방향 1:1 성립.
- nullable + plain UNIQUE = 선택적 1:1 의미에 정확 (NULLS NOT DISTINCT 미사용 옳음).
- lint: 7패키지 eslint.config.mjs 전부 존재, types는 database.ts ignore, config self-ref 비순환, 7 package.json lint 스크립트, turbo.json lint 파이프라인 존재.
- 회귀: 마이그레이션 번호 25 충돌 없음(21~24 예약/부재), diff가 마이그레이션+lint 파일로 한정 — 부수효과 없음.
