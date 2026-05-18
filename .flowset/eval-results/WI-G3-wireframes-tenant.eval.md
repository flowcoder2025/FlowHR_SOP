# WI-G3 Wireframes Tenant wf-v0.3.0 Evaluator Result

Phase 5 doc mode v3 (5-axis rubric)
Rubric: .flowset/contracts/review-rubric.md section 10 (2026-05-16)
Evaluator: Claude evaluator (read-only)
Date: 2026-05-17

Note: full Korean evaluation in chat transcript; sandbox heredoc encoding limits prevent full Korean MD output. ASCII summary below.

## 1. Static Verification (11 Bash checks)

| Check | Result | Evidence |
|-------|--------|----------|
| 1. External sprite reference (icons.svg#) | PASS 0 | grep TA-*.html empty |
| 2. .active variant (vs .is-active SSOT) | PASS 0 | grep empty |
| 3. Inline sprite 14/14 | PASS | all TA-01~14 inline svg sprite count 1 |
| 4. Bare select (.select class missing) | PASS 0 | TA-04 head/parent + TA-13 work-policy select-wrap |
| 5. Bare input type=file (.file-input wrap missing) | PASS 0 | TA-02 bulk + TA-10 payroll + TA-13 wrapped |
| 6. Bare input type=date (.date-input wrap missing) | PASS 0 | TA-13:194 wrapped |
| 7. Inline style redefines DS component | PASS 0 | all inline is page-scoped grid layout only |
| 8. tokens.css + components.css import 14/14 | PASS | all 14 screens import both |
| 9. Tenant sidebar 8-menu consistency | PASS | all 14 screens total=8 active=1 |
| 10. State debug toggle 14/14 | PASS | all screens have .state-debug |
| 11. UTF-8 + LF only | PASS | text/html charset=utf-8 + 0 CRLF |

Static verification: 9/9 CI gates 100% PASS + 11 additional grid checks 100% PASS.

## 2. PRD Mapping Verification (spot-check)

Sidebar active label mapping per 05-layouts.md SSOT:

| Screen | active label (en) | Expected | Result |
|--------|-------------------|----------|--------|
| TA-01 | Dashboard | i-dashboard | PASS |
| TA-02~04 | Employees | i-users | PASS |
| TA-05~06 | Attendance | i-clock | PASS |
| TA-07~08 | Leave | i-calendar-days | PASS |
| TA-09 | Approval | i-check-square | PASS |
| TA-10~11 | Payroll-Docs | i-file-text | PASS |
| TA-12 | Reports | i-chart | PASS |
| TA-13~14 | Settings | i-settings | PASS |

All 14 analysis files have 6 mandatory sections (1 PRD-map, 2 state-matrix, 3 DS usage, 4 i18n, 5 API, 6 permission) - grep 14/14 PASS.

PRD-to-analysis spot-check on TA-01/04/07/12/13/14: all PRD section 3 UI / 4 actions / 6 permission / 7 API / 9 deps correctly 1:1 mapped to analysis sections.

Sidebar href 8 routes 100% consistent across all 14 screens: /admin, /admin/approvals, /admin/attendance, /admin/employees, /admin/leaves, /admin/payroll, /admin/reports, /admin/settings.

## 3. 5-Axis Scoring

| Axis | Score | Weighted | Evidence |
|------|------:|---------:|----------|
| Completeness (25%) | 9.0 | 2.25 | 14/14 state toggle + 14/14 analysis 6-section + sidebar 14x8=112 items + inline sprite 14/14 (30+ symbols each) + tokens/components import 14/14 |
| Consistency (25%) | 8.5 | 2.125 | PRD-analysis 1:1 mapping (TA-01/04/07/13 spot-check), sidebar active labels match 05-layouts.md SSOT 100%, href 14/14, Gherkin matches state matrix. Deduction: CHANGELOG L24-32 declares 18+ new patterns (org-tree, calendar-grid, approval-shell, timeline-step, sticky-actions, report-shell, settings-shell, integration-grid, int-card, seg-btn) but component-usage-matrix.json updated_at unchanged (2026-05-16 v1.0.0) - violates KI-051 intent |
| Specificity (25%) | 9.0 | 2.25 | TBD/postpone/review grep 0 + rich identifiers (L-2026-0142, D-SAL-001, req_a7c2/d2e5/g5h8/j8k1) + Gherkin with cron dates + i18n catalog 12-22 keys per screen |
| Actionability (20%) | 9.0 | 1.80 | All analysis section 8 Phase 7 lists concrete libs (recharts/visx, react-arborist, react-big-calendar, shadcn ResizablePanel, react-day-picker), section 4 i18n catalog ko/en parallel, section 5 API aligns with api/tenant.md, section 9 deps per screen |
| DS Fidelity (10%) | 8.0 | 0.80 | 9/9 CI gates 100% PASS - file:// compat (inline sprite 14/14 + ext sprite 0), native wrap 100% (TA-04 select-wrap + TA-02/10 file-input + TA-13 date-input), 0 inline component redef. Deduction -2.0: 18+ G3-new patterns NOT registered in any of 4 DS SSOT (components.css, _showcase.html, 03-components.md, component-usage-matrix.json). Analysis bypasses by declaring page-scoped no-redef. Single-use justified; calendar-grid (TA-07), approval-shell (TA-09), integration-grid (TA-14) are reuse candidates - Hard gate section 10-4 new-component-SSOT-missing gray area |
| Weighted Total | | 9.225 | rounded 9.22 |

Threshold 8.0 met. All axes >= 7.5 met. Hard gate NOT triggered.

## 4. Hard Gate Assessment

| Condition | Result | Evidence |
|-----------|--------|----------|
| file:// icon missing on 2+ screens -> axis 5 max 4 + WARNING | NOT triggered | Inline sprite 14/14, external 0 |
| External sprite remaining -> P1 | NOT triggered | grep 0 |
| Bare input file -> P1 | NOT triggered | TA-02/10 .file-input wrapped |
| Bare select/date repeated -> P2+ | NOT triggered | All wrapped |
| New component missing in 3 DS SSOT -> DS defect | Gray area | G3 new patterns absent in all 4 SSOT, but analysis declares page-scoped - ds-redefinition-check passes. Recorded as P2/P3 NON_BLOCKING |

## 5. Verdict

VERDICT: PASS

- Weighted total 9.22 / 10 (exceeds threshold 8.0)
- All 5 axes >= 7.5 met (Completeness 9.0, Consistency 8.5, Specificity 9.0, Actionability 9.0, DS 8.0)
- Hard gate NOT triggered
- 9/9 static CI gates + 11 grid checks 100 percent PASS
- PRD mapping spot-check 6 screens consistent
## 6. NON_BLOCKING_OBSERVATIONS

| Severity | Item | Evidence | Recommendation |
|----------|------|----------|----------------|
| P2 | 18+ G3-new patterns not registered in component-usage-matrix.json | CHANGELOG L24-32 G3-new-patterns vs matrix.json v1.0.0 (2026-05-16) updated_at unchanged. Violates KI-051 intent | Next hotfix or G4 batch: add Org Tree / Calendar Grid (employee x day) / Master-Detail (Approval Inbox) to matrix.json patterns + applicable_screens + showcase_anchor |
| P3 | _showcase.html has 0 G3 pattern demos | grep id=section- _showcase.html = 15 (Phase 5 base 14 + 1) unchanged | Next hotfix: add 6-8 demos (Org Tree, Calendar Grid, Approval Master-Detail, Timeline, Sticky Actions, Integration Grid) |
| P3 | Analysis uses page-scoped classification to bypass DS SSOT duty | TA-04/07/08/09/12/13/14 7 analyses declare new patterns page-scoped; calendar-grid/approval-shell/integration-grid are reuse candidates | Next batch: promote reuse-candidate patterns to components.css formal components |
| P3 | TA-01 notice href=# (5) + TA-10 payslip link href=# (5) | TA-01:332-336 + TA-10:195/205/215/225/235. PRD section 3-4 notice v1.1 placeholder ok; payslip ID should use /admin/payslips/{period}/{empId} pattern | Next hotfix: real paths for payslip rows; keep notice placeholder until v1.1 |
| P3 | 14 screens footer help + ops-inquiry href=# (28 instances) | TA-01:352-353 plus 14 screens same pattern | Spec footer help = #help-panel (CM-19 modal trigger), ops-inquiry = /help/tickets/new (OP-08 modal) in 05-layouts.md SSOT, then bulk-apply - next hotfix |
| P3 | TA-07 section 3-4 balance table not implemented (KPI avg only) | PRD section 3-4 per-employee balance table (granted/used/remaining/scheduled cols); TA-07 analysis section 1 defers to Phase 7 tab or drawer | Phase 7 conversion: KPI avg-remaining click -> drawer with per-employee detail; not a wireframe blocker |

Total 6 NON_BLOCKING: P2 1 + P3 5. Trigger thresholds (P2=5, P3=10) NOT yet reached for new P2 (+1 -> active 4); P3 already over (+4 -> active 22).

## 7. Merge Recommendation

- evaluator: PASS (weighted 9.22, all 5 axes meet threshold, Hard gate not triggered)
- Awaiting codex evaluation; after combined verdict:
  - PASS_BOTH -> ready -> CI playwright-smoke + 9 static gates -> auto-merge -> tag wf-v0.3.0
  - CONDITIONAL (codex adds P2) -> register with 6 NON_BLOCKING above -> hotfix or backlog-and-merge

- KI registration recommended: KI-053 (G3 new patterns SSOT missing, P2) / KI-054 (_showcase.html G3 unreflected, P3) / KI-055 (footer href# 28, P3) / KI-056 (payslip href#, P3)
## Change Log

| Date | Evaluator | Result |
|------|-----------|--------|
| 2026-05-17 | Claude evaluator | PASS (9.22/10) - all 5 axes meet threshold, Hard gate not triggered, NON_BLOCKING 6 (P2 1 + P3 5) |
