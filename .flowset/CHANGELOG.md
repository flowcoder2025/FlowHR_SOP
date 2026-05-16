# FlowHR 변경 이력 (Phase 5 와이어프레임)

> Phase 5 와이어프레임 작업의 산출물 버전 이력. SemVer 변형 (`wf-vMAJOR.MINOR.PATCH`).
>
> - MAJOR: Phase 5 evaluator PASS 시 1.0.0
> - MINOR: 화면 그룹(G1~G4) 완료
> - PATCH: 그룹 종료 후 결함 핫픽스
>
> Git tag와 1:1 동기화. 산출물 단위는 git에 push되어야 의미가 있음.

## [wf-v0.1.0] — 2026-05-16 (G1 최초 진입점 완료)

### 산출물

**디자인 시스템 확장 (비인증 영역)**:
- `_design-system/_layout-auth.html` 신설 (헤더 + 메인 + 푸터, AppShell과 별개)
- `components.css` 추가 — auth-shell / auth-header / auth-main / auth-card (+ narrow/wide) / auth-brand / auth-lang-toggle / password-field / password-toggle / auth-alert (info/warning/error/success) / auth-aux / otp-group / otp-input / auth-hero / legal-shell / legal-toc / legal-body / install-grid / install-card
- `icons.svg` 4종 추가 — i-globe / i-eye-off / i-lock / i-smartphone-share
- tooltip 헤더 내 자동 bottom 표시 (사용자 검수 피드백)

**8 비인증 화면 (각 5 상태)**:
- CM-01 로그인 — default/loading/error/locked/success(2FA)
- CM-02 비밀번호 찾기 — step1(이메일) → sent(발송) → step2(재설정) → expired/done
- CM-03 최초 계정 활성화 — invite(정보) → setup(비밀번호+약관) → two_fa(QR+OTP+복구8) → expired/done
- CM-04 2단계 인증 — input(OTP) → loading → error → recovery(복구) → done
- CM-05 권한 없음 (403) — default / role(역할) / tenant(테넌트) / session(만료) / contact(문의)
- CM-06 오류/점검 — not_found(404) / server(500) / maintenance / service_unavailable(503) / network
- CM-20 PWA 설치 가이드 — ios / android / desktop(Tauri) / ios_old / already_installed
- CM-21 약관/개인정보 — terms_ko / privacy_ko / en_reference / force_consent / new_version

**analysis 8 파일** — PRD 매핑 + 상태 매트릭스 + i18n 키 + API 매핑 + Phase 7 변환 가이드

**자동화 체계 (.claude/rules/project.md §6)**:
- PR 머지 후 표준 정리 시퀀스 명시 (checkout main + pull + fetch --prune + tag + branch -d)
- 다음 브랜치 시작 시 항상 최신 main 기준
- CI fail / admin 우회 / 원격 누락 fallback

### CI 게이트

- 모든 화면 5 게이트 통과 (commit-msg / utf8+lf / html-syntax / design-system-ssot / version-format)

### 다음 단계

- G2 운영 (OP-02~12, 11 화면, OP-01 완료분 활용)

## [wf-v0.0.0] — 2026-05-16 (베이스라인)

### 배경

Phase 5 와이어프레임 본격 시작 직전. 누적 변경 (batch-003 / batch-004 / batch-005 + OP-01 시범) 정리 + 버전 체계 도입.

### 변경

**batch-003 (KI-027~031 P1 5건 해소)** — 2026-05-15
- `prd/09-routing.md` 신규 (호스트·서브도메인 + 라우트 인벤토리 + 진입 분기 + 가드 매트릭스)
- `prd/domains/operator/OP-12-profile.md` 신규 (운영사 본인 프로필)
- `prd/domains/common.md` CM-16~22 추가 (헤더 글로벌 4종 + PWA 설치 + 약관 + 온보딩)
- `prd/04-data-model.md` LegalDocument + UserConsent 엔티티 (37 → 39)
- `prd/06-mvp-scope.md` 화면 카운트 36 → 44 (✓ 37 + △ 7)
- `db/erd.md` + `rls.md` + `indexes.md` + `enums.md` + `migrations.md` 컴플라이언스 도메인 보강
- `api/auth.md` + `common.md` + `schemas.md` 라우팅/약관/동의/온보딩/도움말 엔드포인트
- `backlog/stories.md` ST-073~080 (8 신규 / 합계 80 Story / 415 SP)
- `spec/matrix.json` entities 39 + screens 44
- `.claude/agents/evaluator.md` + `contracts/review-rubric.md` Doc 검증 축 보강

**batch-004 (KI-037 디자인 시스템 SSOT — PASS 8.61)** — 2026-05-16
- `wireframes/_design-system/` 12 파일 신규 (README + 7 spec + tokens.css + components.css + icons.svg + _layout-shell.html)
- `wireframes/_showcase.html` 컴포넌트 시연 (29 섹션)
- 16+ 컴포넌트 Anatomy + Props + Variant matrix
- Variable Notation 정책 + SVG 정렬 의무 + IconButton 배지 좌측 anchor + 인접 gap 16+
- EmptyState descendant 누설 차단 (`> svg.ico-empty` direct child)
- Logo + TenantLogo 컴포넌트 신설

**batch-005 (i18n MVP — ko + en 동시)** — 2026-05-16
- `prd/01-personas.md` P8 외국인 근로자 페르소나
- `prd/03-tech-architecture.md` next-intl (ko/en)
- `prd/06-mvp-scope.md` 영어 MVP 포함
- `prd/04-data-model.md` LegalDocument.language + users.locale
- `prd/domains/common.md` CM-15 알림 채널 locale 분기 + CM-16 "언어/Language" 메뉴 + CM-21 ko/en 페어 게시 + 이메일 템플릿 ko/en 10종
- `db/migrations.md` + `db/indexes.md` i18n 컬럼 + system_settings.brand_logo_url + brand_name
- `api/auth.md` + `common.md` + `schemas.md` + `employee.md` + `operator.md` locale API + 우선순위 결정
- `wireframes/_design-system/08-i18n.md` 신규 (정책 + 키 catalog + 컴포넌트 매핑 + Phase 7 next-intl)
- `_design-system/03-components.md` §2-2 i18n + `07-react-mapping.md` §8 next-intl

**OP-01 시범** — 2026-05-16
- `wireframes/html/OP-01.html` 디자인 시스템 적용 시범 (PASS 8.61)
- `wireframes/analysis/OP-01.md` PRD 매핑 분석
- `eval-results/WI-KI-batch-004-design-system.{eval.md,pass}` 평가 결과

**구조 정리** — 2026-05-16
- 구 OP-02~12 HTML 11개 + 구 analysis 11개 → `wireframes/_archive-pre-design-system/` 이동 (KI-041)
- `VERSION` + `CHANGELOG.md` 신설 (Phase 5 와이어프레임 버전 체계 도입)

### Known Issues 상태

- P0/P1/P2 활성: 0건 ✅
- P3 활성: 14건 (KI-005~007/013/016/017/020/023/025/032~036/038/040/041)

### 평가 점수

| Phase | 초안 | 재평가 (batch-003+005 정합) |
|-------|------|---------------------------|
| 1 PRD | 8.15 | 9.13 |
| 2 백로그 | 8.29 | 8.03 |
| 3 ERD | 8.68 | 8.21 |
| 4 API | 8.78 | 8.40 |
| 디자인 시스템 (KI-037) | — | 8.61 PASS |
