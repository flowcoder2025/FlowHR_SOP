# Archive — Pre-Design-System 와이어프레임

> **이동 일자**: 2026-05-16 (wf-v0.0.0 베이스라인 정리)
> **이동 사유**: KI-041 — 디자인 시스템 SSOT(`_design-system/`) 적용 전 작성된 OP-02~12 HTML + analysis 11세트가 구 패턴(인라인 컴포넌트 정의, 자체 토큰/아이콘 CSS)으로 작성되어 stale. 신규 화면은 `_design-system/_layout-shell.html` 복사 패턴으로 재작성 예정.
> **보존 방침**: 글로벌 규칙(`wi-flowset.md`) `.flowset/` 파일 삭제 금지 → archive 이동으로 보존. 참고용 (디자인 의도, 콘텐츠 구조 일부 재활용).

## 구조

```
_archive-pre-design-system/
├── README.md            # 본 문서
├── html/                # OP-02~12 11 파일 (구 인라인 컴포넌트 정의)
└── analysis/            # OP-02~12 11 파일 (구 패턴 PRD 매핑)
```

## 신규 화면 작성 경로

- HTML: `_design-system/_layout-shell.html` 복사 → `html/{화면ID}.html`
- 분석: 별도 `analysis/{화면ID}.md` 신규 작성 (디자인 시스템 컴포넌트 매핑 포함)

## 디자인 시스템 SSOT 정책 (변경 금지)

- `_design-system/` 단일 source — 인라인 컴포넌트 정의 금지
- 페이지 HTML은 import + grid layout만 허용
- 헤더/사이드바/푸터 변경 금지
- SVG width/height attribute 의무 (컴포넌트 강제값 일치)
- IconButton 배지 좌측 anchor + 인접 gap 16+

## 참조

- `.flowset/HANDOFF.md` §3 신규 세션 첫 작업
- `.flowset/wireframes/_design-system/README.md`
- `.flowset/wireframes/_design-system/03-components.md`
- `.flowset/wireframes/_design-system/05-layouts.md`
