# FlowHR — 개발용 PRD (분할 인덱스)

> Phase 1 산출물. 도메인 × 화면 단위로 분할. 본 README가 전체 네비게이션.

## 출처 / 의존

- 사용자 원본 SSOT: `.flowset/requirements.md`
- 원본 화면 명세: `docs/FlowHR_screen_spec_v_1.md`
- 데이터 모델 SSOT: `.flowset/spec/matrix.json`
- 계약: `.flowset/contracts/{api-standard,data-flow,style-guide,review-rubric,sprint-template}.md`

## 개요 섹션 (9개 파일)

| # | 파일 | 내용 |
|---|------|------|
| 00 | [00-product-overview.md](00-product-overview.md) | 제품 비전, 정의, 가격, 시장 |
| 01 | [01-personas.md](01-personas.md) | 운영사 / 테넌트 관리자 / 직원 페르소나 + 사용자 여정 |
| 02 | [02-device-matrix.md](02-device-matrix.md) | Web / PWA / Tauri Desktop 매트릭스 + 화면별 가용성 |
| 03 | [03-tech-architecture.md](03-tech-architecture.md) | Next.js + Supabase + Tauri 아키텍처, 모노레포 |
| 04 | [04-data-model.md](04-data-model.md) | 엔티티 관계 + matrix.json 매핑 |
| 05 | [05-nfr.md](05-nfr.md) | 성능 / 보안 / 접근성 / i18n / 감사 / 백업 |
| 06 | [06-mvp-scope.md](06-mvp-scope.md) | MVP 범위 / 후순위 / 출시 기준 |
| 07 | [07-risks.md](07-risks.md) | 리스크 / 가정 / 외부 의존성 |
| 08 | [08-success-metrics.md](08-success-metrics.md) | KPI / OKR / 성공 지표 |

## 도메인 (36 화면)

### 공통 시스템
- [domains/common.md](domains/common.md) — 로그인 / 알림 / 파일 / 감사로그 등 15종

### 운영사 (OP-01 ~ OP-11)
- [domains/operator/README.md](domains/operator/README.md) — 도메인 개요
- 화면 11개: 운영사 대시보드, 테넌트 관리, 테넌트 상세, 온보딩, 요금제, 청구, 기능 플래그, 지원 티켓, 감사 로그, 운영 리포트, 시스템 설정

### 테넌트 관리자 (TA-01 ~ TA-14)
- [domains/tenant-admin/README.md](domains/tenant-admin/README.md) — 도메인 개요
- 화면 14개: 관리자 대시보드, 직원 관리, 직원 상세, 조직도, 근태 관리, 근태 수정 요청, 휴가 관리, 휴가 신청 상세, 결재/승인, 급여/문서, 문서함/전자계약, 리포트, 회사 설정, 외부 연동

### 직원 (EM-01 ~ EM-11)
- [domains/employee/README.md](domains/employee/README.md) — 도메인 개요
- 화면 11개: 내 대시보드, 출퇴근, 휴가 신청, 내 휴가 현황, 내 결재/진행현황, 급여명세서, 문서 조회, 증명서 요청, 내 정보, 알림함, 요청 내역

## 화면 파일 정형 템플릿

각 화면 파일(`OP-NN-*.md` / `TA-NN-*.md` / `EM-NN-*.md`)은 다음 형식을 따른다.

```markdown
---
screen_id: OP-01
screen_name: 운영사 대시보드
role: [operator_super, operator_staff]
entities: [Tenant, Subscription, Invoice, Ticket]
platforms: [web, desktop_tauri]
mvp: true
spec_ref: docs/FlowHR_screen_spec_v_1.md#6-1
---

# {screen_id} {screen_name}

## 1. 목적
화면의 비즈니스 목적 1~3문장.

## 2. 사용자·권한
spec §9 권한 매트릭스 인용 + 본 화면의 역할×권한.

## 3. UI 요소
KPI / 차트 / 테이블 / 필터 / 검색 / 버튼 / 모달 / 폼.

## 4. 액션
사용자가 수행 가능한 액션 목록 (한글 라벨 + 영문 핸들러).

## 5. 상태값
화면 또는 데이터의 상태 enum.

## 6. 연관 엔티티
matrix.json `entities[]` 참조. 본 화면이 사용하는 엔티티 + 권한(C/R/U/D).

## 7. 연관 API
Phase 4 OpenAPI 채울 자리 표시. 메서드 + 경로.

## 8. 수용 기준 (Gherkin)
Given/When/Then 시나리오 (최소 3개: 골든 패스 + 권한 음성 + 엣지).

## 9. 의존성
다른 화면 / 엔티티 / 외부 시스템.
```

## 진행 흐름

| 단계 | 산출물 | evaluator 호출 |
|------|--------|--------------|
| 1.0 | 본 README + 개요 9개 (00~08) | (Phase 1 최종에 일괄) |
| 1.1 | `domains/common.md` | doc 모드 부분 평가 (공통) |
| 1.2 | `domains/operator/` 12개 (README + OP-01~11) | doc 모드 부분 평가 (운영사) |
| 1.3 | `domains/tenant-admin/` 15개 (README + TA-01~14) | doc 모드 부분 평가 (관리자) |
| 1.4 | `domains/employee/` 12개 (README + EM-01~11) | doc 모드 부분 평가 (직원) |
| 1.5 | `matrix.json` entities 채움 | doc 모드 평가 (모델) |
| 1.6 | 전체 PRD 통합 평가 | doc 모드 최종 평가 |

각 부분 평가에서 FAIL이면 해당 부분만 재작업. 최종 통합 평가 PASS 후 Phase 2 진입.
