# FlowHR — 백로그 (Epic / Story / Task)

> Phase 2 산출물. SSOT: `.flowset/spec/matrix.json` (`screens_total: 44` — PRD 화면 SSOT) + `.flowset/prd/` 도메인 문서. Phase 5 와이어프레임은 OP-01 추가로 45개 (`.flowset/wireframes/`에 별도 카운트).
> 분할 구조: Epic(도메인 모듈) → Story(화면 × 역할) → Task(WBS).
> 현재 합계 (보강 후, KI-013/034 closure 2026-05-19 + Phase 2 재평가 정정): **80 Story / 415 SP / 223 Task / 838 MD (보수적 환산)** — 상세는 stories.md `## 전체 요약` + tasks.md `## Task 추정`.

## 파일 인덱스

| 파일 | 내용 |
|------|------|
| [epics.md](epics.md) | 12개 Epic 마스터 (도메인 × 모듈 단위) |
| [stories.md](stories.md) | User Story 매트릭스 (역할 × 화면 × 골든 패스) |
| [tasks.md](tasks.md) | Task WBS — 각 Story 분해 (FE/BE/DB/QA) |
| [dependency-graph.md](dependency-graph.md) | Epic·Story·Task 의존성 그래프 |
| [estimation.md](estimation.md) | Task별 스토리포인트 + MD 추정 |

## 카테고리

### Epic 12개 (도메인 × 기능 클러스터)

| Epic ID | 제목 | 화면 | MVP 우선순위 |
|---------|------|------|------------|
| EP-01 | 인프라 / 인증 / 권한 베이스 | CM-01~05, 보안 인프라 | P0 (Sprint 1) |
| EP-02 | 운영사 테넌트 라이프사이클 | OP-02, OP-03, OP-04 | P0 |
| EP-03 | 운영사 수익 / 청구 / 플랜 | OP-05, OP-06 (△), OP-10 (△) | P1 |
| EP-04 | 운영사 기능 권한 / 시스템 | OP-07, OP-11 | P1 |
| EP-05 | 운영 지원 / 티켓 / 감사 | OP-08, OP-09 | P1 |
| EP-06 | 테넌트 직원 / 조직 관리 | TA-02, TA-03, TA-04 | P0 |
| EP-07 | 테넌트 근태 관리 | TA-05, TA-06, EM-02 | P0 |
| EP-08 | 테넌트 휴가 / 결재 | TA-07, TA-08, TA-09, EM-03, EM-04, EM-05 | P0 |
| EP-09 | 테넌트 문서 / 급여 | TA-10, TA-11 (△), EM-06, EM-07, EM-08 | P1 |
| EP-10 | 테넌트 설정 / 외부 연동 | TA-13, TA-14 (△), TA-12 (△) | P2 |
| EP-11 | 직원 셀프 서비스 | EM-01, EM-09, EM-10, EM-11 (△) | P0 |
| EP-12 | 공통 인프라 (알림 / 파일 / 감사) | CM-07, CM-09~15 | P0 |

### 화면 매트릭스 SSOT 매핑

각 Story는 matrix.json `screens_to_entities_map[화면ID]`를 그대로 인용.
각 Task는 matrix.json `entities[엔티티명].permissions` × CRUD로 분해.

### 역할 (matrix.json roles)

| 역할 | Story 작성 시점 |
|------|--------------|
| operator_super, operator_staff | 운영사 도메인 Story |
| tenant_super, tenant_hr_admin | 관리자 도메인 Story |
| tenant_manager | 결재·팀 모니터링 Story |
| employee | 직원 셀프 서비스 Story |

## 작성 규칙

### Epic 형식
```markdown
## EP-NN {제목}
- 목표: 비즈니스 가치 1~2 문장
- 화면: [목록]
- 엔티티: [목록]
- 의존: [선행 Epic]
- 수용 기준: 매트릭스 셀 단위
- 추정: 스토리포인트 합계
```

### User Story 형식
```markdown
## ST-NN {화면ID-역할} {제목}
As a {역할}
I want to {목적}
So that {가치}

Acceptance (Gherkin 시나리오 ID 인용 — PRD 화면 §8 참조):
- AC-1: {시나리오 이름}
- AC-2: ...

엔티티/권한:
- {Entity:CRUD per role}

API:
- {엔드포인트 목록}

추정: {SP}
의존: {선행 Story}
```

### Task 형식
```markdown
### TS-NN {Story ID}-{유형} {제목}
- 유형: FE | BE | DB | QA | DEVOPS
- 작업 내용: 구체적 결과물
- 산출물: {파일 경로 / 컴포넌트 / 마이그레이션}
- 추정: {시간 또는 MD}
- 검증: {수용 기준 자동 테스트 가능 여부}
```

## 진행 흐름

| Step | 산출물 | evaluator |
|------|--------|----------|
| 2.0 | README + epics.md 12개 | — |
| 2.1 | stories.md (44 화면 × 역할 매트릭스 도출, MVP 우선순위) | — |
| 2.2 | tasks.md (Story별 FE/BE/DB/QA Task 분해) | — |
| 2.3 | dependency-graph.md + estimation.md | — |
| 2.4 | 전체 백로그 evaluator (doc 모드) | doc |
