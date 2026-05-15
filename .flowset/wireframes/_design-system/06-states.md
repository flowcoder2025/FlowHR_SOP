# 06. 상태 패턴 (Empty / Loading / Error / Success)

> 모든 동적 데이터 영역은 4 상태를 명시적으로 처리. 와이어프레임에서 시각화 + Phase 7 코드에서 1:1 매핑.

## 4 상태

| 상태 | 클래스 | 시각 |
|------|-------|------|
| Empty (데이터 0건) | `.empty-state` | 아이콘 + 타이틀 + 설명 + (옵션) CTA |
| Loading | `.skeleton` | shimmer 애니메이션 회색 박스 |
| Error | `.banner.danger` 또는 `.empty-state` 변형 | 에러 메시지 + 재시도 버튼 |
| Success | `.toast.success` 또는 `.banner.success` | 짧은 알림 (3초 자동 dismiss) |

## Empty State 예시

```html
<div class="empty-state">
  <svg class="ico"><use href="../_design-system/icons.svg#i-building"/></svg>
  <div class="title">아직 등록된 테넌트가 없습니다</div>
  <div class="desc">"신규 테넌트 등록" 버튼을 눌러 첫 고객사를 추가하세요.</div>
  <button class="btn btn-primary" style="margin-top:16px;">
    <svg class="ico"><use href="../_design-system/icons.svg#i-plus"/></svg>신규 테넌트 등록
  </button>
</div>
```

화면별 Empty 카피 (예시):
- OP-02 (테넌트 0건): "아직 등록된 테넌트가 없습니다"
- OP-08 (티켓 0건): "신규 티켓이 없습니다 — 잘 운영되고 있어요"
- TA-02 (직원 0건): "직원을 초대하여 시작하세요"
- EM-04 (휴가 신청 0건): "신청한 휴가가 없습니다"
- EM-10 (알림 0건): "새 알림이 없습니다"

## Loading 패턴

### KPI 카드 skeleton
```html
<div class="kpi-card">
  <div class="skeleton" style="height:13px;width:80px;margin-bottom:8px;"></div>
  <div class="skeleton" style="height:28px;width:120px;"></div>
  <div class="skeleton" style="height:12px;width:100px;margin-top:8px;"></div>
</div>
```

### 테이블 skeleton (행 N개)
```html
<tr><td colspan="N">
  <div class="skeleton" style="height:18px;margin:6px 0;"></div>
</td></tr>
```

### 풀스크린 spinner
```html
<div style="display:flex;align-items:center;justify-content:center;padding:48px;">
  <svg class="ico ico-lg" style="animation:spin 1s linear infinite;color:var(--color-accent);">
    <use href="../_design-system/icons.svg#i-loader"/>
  </svg>
</div>
<style>@keyframes spin { to { transform: rotate(360deg); } }</style>
```

## Error 상태

### 카드 단위 에러 (KPI fetch 실패)
```html
<div class="kpi-card" style="border-color:var(--color-danger-bg);">
  <div class="kpi-label" style="color:var(--color-danger);">
    <svg class="ico"><use href="../_design-system/icons.svg#i-alert-c"/></svg>로드 실패
  </div>
  <div class="kpi-value" style="font-size:14px;color:var(--color-text-muted);">데이터를 불러올 수 없습니다</div>
  <button class="btn btn-ghost btn-sm" style="margin-top:6px;">재시도</button>
</div>
```

### 페이지 단위 에러 (500)
```html
<div class="empty-state">
  <svg class="ico ico-lg" style="color:var(--color-danger);"><use href="../_design-system/icons.svg#i-alert-t"/></svg>
  <div class="title">문제가 발생했습니다</div>
  <div class="desc">잠시 후 다시 시도하거나 운영팀에 문의해 주세요.</div>
  <div style="display:flex;gap:8px;margin-top:16px;justify-content:center;">
    <button class="btn btn-secondary">재시도</button>
    <button class="btn btn-ghost">티켓 작성</button>
  </div>
</div>
```

### 폼 검증 에러
```html
<div class="form-row-stacked">
  <label class="label">사업자번호</label>
  <input class="input" value="123456" />
  <div class="input-error">
    <svg class="ico ico-sm"><use href="../_design-system/icons.svg#i-alert-c"/></svg>
    사업자등록번호 형식이 올바르지 않습니다 (123-45-67890)
  </div>
</div>
```

## Success 상태

### Toast (3초 자동 dismiss)
```html
<div class="toast success">
  <svg class="ico"><use href="../_design-system/icons.svg#i-check-circle"/></svg>
  저장되었습니다
  <span class="close"><svg class="ico ico-sm"><use href="../_design-system/icons.svg#i-x"/></svg></span>
</div>
```

### 인라인 banner
```html
<div class="banner success">
  <svg class="ico banner-icon"><use href="../_design-system/icons.svg#i-check-circle"/></svg>
  <div class="banner-content">
    <div class="banner-title">테넌트 등록 완료</div>
    (주)치킨매니아의 관리자(lee@chicken.com)에게 초대 메일을 발송했습니다.
  </div>
</div>
```

## 권한 차단 (CM-05)

```html
<div class="empty-state">
  <svg class="ico ico-lg" style="color:var(--color-warning);"><use href="../_design-system/icons.svg#i-shield"/></svg>
  <div class="title">접근 권한이 없습니다</div>
  <div class="desc">/operator/tenants — operator_super 권한이 필요합니다</div>
  <div style="font-size:11px;color:var(--color-text-subtle);margin-top:8px;">
    시도 시각: 2026-05-16 10:32 · 감사 로그 ID: req_abc123
  </div>
  <div style="display:flex;gap:8px;margin-top:16px;justify-content:center;">
    <button class="btn btn-secondary">이전 화면</button>
    <button class="btn btn-primary">내 대시보드로</button>
  </div>
</div>
```

## 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-16 | 초안 — 4 상태 패턴 + 권한 차단 | KI-037 |
