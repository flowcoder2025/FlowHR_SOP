# Known Issue 063 — Resolved

- **Date**: 2026-05-18
- **WI**: WI-G4prep-ci (CI sprite use ↔ symbol cross-check 강화)
- **Trigger**: G4 진입 전 의무 (HANDOFF.md §4) — G3 PR #9/#10 사고 교훈
- **Mode**: CI workflow 정적 체크 승격 (codex 부담 감소 + 자동화)

## 해소된 이슈 (1건)

### KI-063 (P2) — CI inline-svg-sprite-check sprite cross-check 미실시 → 강화

**사고 배경 (재발 방지 대상)**:
- G3 wf-v0.3.0 양산 중 TA-03 화면에서 `<use href="#i-arrow-right">` 외 3건 (`i-download`, `i-eye`, `i-pdf`)을 참조했으나 인라인 sprite block에 해당 symbol 정의 누락
- Playwright smoke 결과 `iconInvisible 13/34 FAIL` — 4 symbol 누락이 TA-03 13개 use에 영향
- 1차 hotfix (PR #9) — svg use에 width/height attribute 추가 시도, 효과 없음 (sprite 정의 자체 부재)
- 2차 hotfix (PR #10) — sprite block에 4 symbol 추가, Playwright PASS
- 기존 CI는 sprite block 존재만 검사 (`xmlns="http://www.w3.org/2000/svg" style="display:none"` grep 1줄) — 사용된 href와 정의된 symbol id의 cross-check 미실시

**강화 내용** (`.github/workflows/pr-checks.yml` `inline-svg-sprite-check` job §3 신규):
```bash
for f in .flowset/wireframes/html/*.html; do
  used=$(grep -oE 'use href="#i-[a-z0-9-]+"' "$f" | sed 's/use href="#//;s/"$//' | sort -u)
  defined=$(grep -oE '<symbol id="i-[a-z0-9-]+"' "$f" | sed 's/<symbol id="//;s/"$//' | sort -u)
  [ -z "$used" ] && continue
  missing=$(comm -23 <(echo "$used") <(echo "$defined"))
  if [ -n "$missing" ]; then
    echo "::error file=$f::sprite cross-check 실패 — use에 있으나 symbol 정의 누락:"
    echo "$missing" | sed 's/^/    - /'
    fail=1
  fi
done
```

**검증 결과 (로컬)**:
- 대상: `.flowset/wireframes/html/*.html` 34 화면 (CM 8 + OP 12 + TA 14)
- PASS: 34/34
- FAIL: 0
- TA-03 hotfix4 결과 (sprite 4 symbol 추가)도 cross-check 정상 통과 확인

**기대 효과**:
- G4 양산부터 sprite symbol 누락이 CI 단계에서 차단 (Playwright smoke 실패 전 발견)
- codex 리뷰 부담 감소 — review-system.md §17-5 (codex 반복 지적 항목 → CI 정적 체크 승격) 정책 부합
- file:// 호환 검증 누락 사각 해소

## 영향 받지 않는 영역

- `_design-system/_layout-*.html` 템플릿: 화면 작성자가 sprite 추가하는 구조 (use도 sprite도 미보유 시 통과)
- 외부 svg 참조 (`../_design-system/icons.svg`): §1에서 이미 차단됨 — 본 §3는 fragment-only ref만 대상

## 사용자 개입 시점

- 없음 — codex 부담 감소 정책에 따른 자동 강화 (review-system.md §17-5)
- 사용자 결정 6 시점 (review-system.md §10) 해당 사항 없음

## 변경 파일

- `.github/workflows/pr-checks.yml` (`inline-svg-sprite-check` job §3 추가, +16 lines)
- `.flowset/known-issues/INDEX.md` (KI-063 strike + P2 카운트 7 → 6)
- `.flowset/known-issues/archive/2026-05-18-ki-063-sprite-cross-check.md` (본 파일)
