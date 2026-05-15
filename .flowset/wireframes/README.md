# Phase 5 — 와이어프레임 (HTML 직접 작성, 2026-05-15 정책 변경)

> **정책 변경**: Codex 이미지 생성 폐기. HTML(Tailwind + shadcn 패턴) 직접 작성으로 단일 채택.
> SSOT: matrix.json + prd/domains/ + db/erd.md + api/.
> 폐기 자산은 `_archive-codex/`로 이동 (이력 보존).

## 디렉토리 구조

```
wireframes/
├── README.md                # 본 문서
├── _design-refs/            # 사용자 제공 디자인 참고 이미지 (학습용, 유지)
├── _archive-codex/          # 폐기된 Codex 자산 (이력 보존)
│   ├── README.md
│   ├── prompts/             # 폐기된 이미지 프롬프트 36개
│   ├── images/              # 폐기된 Codex 생성 이미지 (OP-01.png)
│   └── .codex-op01-prompt.txt
├── html/                    # 신규: HTML 와이어프레임 (Phase 5 진입점)
│   ├── _design-tokens.css   # 공통 디자인 토큰 (style-guide.md 인용)
│   ├── _icons.css           # 아이콘 클래스
│   ├── _icons.svg           # Lucide outline SVG 스프라이트
│   ├── {ID}.html            # 화면별 HTML (OP-01 ~ EM-11 + CM-* + 신규 화면)
│   └── ...
└── analysis/                # Claude 컴포넌트 분해 / 인터랙션 / 반응형 정리 ({ID}.md)
```

## 작성 정책

### 1. SSOT 우선
각 HTML은 다음 4 파일을 SSOT로 그대로 반영:
- `prd/domains/.../{ID}-*.md` — 화면 명세 §3 UI 요소 / §4 액션 / §5 상태값 / §6 엔티티
- `matrix.json.screens_to_entities_map[{ID}]` — 권한 매트릭스
- `db/enums.md` — 상태 enum 한글 매핑
- `api/{domain}.md` — 연관 API (action handler)

### 2. 컴포넌트 일관성
- `_design-tokens.css` / `_icons.svg` 공유 — 디자인 토큰 변경 시 한 곳에서
- shadcn/ui 패턴 흉내 (card / button / table / badge / filter-chip / tabs / input)
- Lucide outline 아이콘만 (emoji 금지)

### 3. PRD 1:1 검증 의무
HTML 작성 후 PRD § 1:1 매핑 체크리스트로 검증:
- §3-1 KPI 카드: 갯수·라벨·수치 일치
- §3-2 차트: 유형·데이터 카테고리 일치
- §3-3 테이블 컬럼: 컬럼명·정렬 일치
- §3-4 필터: 모든 필터 항목 존재
- §4 액션: 모든 액션 버튼 존재 + 핸들러 명시
- §5 상태값: enum 한글 라벨 정확

### 4. 한글 라벨 정확
- enums.md `enumLabels` 매핑 그대로 사용
- 영문 코드는 `class`/`data-*` 속성에만, 표시 텍스트는 한글
- 모든 한글이 Pretendard 또는 system Korean font로 렌더

### 5. 반응형 변형
각 화면 HTML은 default = web 데스크톱 (1440x900). PWA / Tauri 변형은:
- 같은 파일에서 `@media (max-width: 768px)` 추가
- 또는 별도 `{ID}.pwa.html`로 분리 (선택)

## 진행 흐름

| Step | 산출물 | evaluator |
|------|--------|----------|
| 5.0 | _design-tokens.css + _icons.svg + _icons.css (공통, 완료) | — |
| 5.1 | OP-01.html 시범 (현재 작성됨 — PRD 보강 후 재검증) | (수동) |
| 5.2 | 운영사 11 화면 HTML 일괄 | doc 부분 평가 |
| 5.3 | 관리자 14 화면 HTML 일괄 | doc 부분 평가 |
| 5.4 | 직원 11 화면 HTML 일괄 | doc 부분 평가 |
| 5.5 | 공통/신규 화면 (CM-16~19, OP-12, 약관, PWA 설치 등) | doc 부분 평가 |
| 5.6 | analysis/*.md — 화면별 컴포넌트 분해 + 인터랙션 + 반응형 | — |
| 5.7 | 전체 evaluator (doc 모드, 8.0+) | doc |

## 본 정책의 발효 조건

본 README는 PRD 누락 결함 보강(KI-027~031) 해소 후 Phase 5 재시작 시점부터 유효.
직전 OP-01.html 시범은 PRD §3-4 필터 / §4 액션 누락 발견 + 정합 보강 후 PRD 보강 작업과 함께 재작업 권장.

## 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-15 | 초안 (Codex 정책) | Phase 5 진입 |
| 2026-05-15 | 정책 변경 — Codex 폐기 / HTML 직접 작성으로 단일 채택 + PRD 누락 결함 보강 후 재시작 | HANDOFF.md 참조 |
