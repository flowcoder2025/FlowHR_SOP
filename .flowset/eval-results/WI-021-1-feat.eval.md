# WI-021-1-feat — evaluator 채점 (Phase 7, code 모드)

> 브랜치 feature/WI-021-1-feat-entity-schemas · 2026-05-29
> scope: ERD 39 entity zod schema 변환 (DB snake_case 1:1). Sprint 1 잔여 (WI-021 분할).

## 평가 이력

| 라운드 | 가중 | 판정 | 비고 |
|------|------|------|------|
| 1차 | 8.25 | **FAIL** | 총점 8.0 통과이나 테스트 커버리지 축 6.0 < 7.5 하드게이트 미달 (entity 단위 테스트 0건) |
| 재평가 | **8.75** | **PASS** | entities.test.ts 23 tests 추가 + codex P1 정정 반영 |

## 재평가 채점 (PASS 8.75)

| 축 | 가중 | 점수 | 근거 |
|----|----|----|------|
| 기능 완성도 | 30% | 9 | 39 row entity + Location 전부 정의, database.ts Row 1:1. stub/any 0. date↔datetime 구분 정확. DB enum(operator_users.role) vs DB text(employees.role=z.string()) 구분 정확 |
| 코드 품질 | 25% | 9 | 도메인별 8 파일 분리, common.ts uuid/timestamp 재사용, SSOT/정정 근거 주석. enum 33종 중앙화. 중복/매직값 0 |
| 테스트 커버리지 | 25% | 8 | entities.test.ts 23 tests/36 assertions — date↔datetime 양방향, DB text 허용, enum/uuid/email/좌표 음성. 28 passed 실측. (1차 6.0 → 해소) |
| 계약 준수 | 20% | 9 | openapi.yaml 45 components 결정적, 정정 반영. enums.ts 값 enums.md SSOT 1:1. 범위(entity만, endpoint 제외) sprint-001 L160 준수 |

**THRESHOLD**: 8.0 (각 축 ≥7.5) → **PASS**.

## 통합 (codex)

codex 1차 P1×3(role/role/document_type) + 2차 P1(ip_address nullable) 진짜 결함 정정 + false alarm 5건(issued_at/component naming/rememberMe/enums.md/required) 확인. codex 4차 PASS → **PASS_BOTH**.

## NON_BLOCKING (P3 → KI-090)

- entity 단위 테스트 39 중 11개만 직접 (미검증 28 동일 빌더 패턴)
- work_policies time(standard_clock_in 등) / user_consents inet(ip_address) 형식 refine 부재 — 임의 string 통과(DB 저장 시 거부되므로 무결성 위험 낮음)
