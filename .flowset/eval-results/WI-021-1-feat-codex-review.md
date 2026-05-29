# WI-021-1-feat — codex 듀얼검증 리뷰 (4 라운드)

> 출처: codex (codex:codex-rescue, read-only) · 2026-05-29 · 브랜치 feature/WI-021-1-feat-entity-schemas
> review-system.md §7-1 듀얼검증. database.ts Row 1:1 대조.

## 라운드 경과

| 라운드 | 커밋 | verdict | 내용 |
|------|------|---------|------|
| 1차 | 7dfee45 | FAIL | P1 진짜 3 (employees.role/users.role/user_consents.document_type — DB text vs enum) + P1 false 4 |
| 2차 | c156aa7 | FAIL | 1차 정정 확인 + 신규 P1 진짜 1 (user_consents.ip_address — DB nullable inet vs non-null) |
| 3차 | bdbb570 | FAIL | ip_address 정정 확인 + P false (openapi required 잔존을 dist 누락으로 오판) |
| 4차 | bdbb570 | **PASS** | required 잔존이 zod .nullable() 정확 출력임 인정, 잔여 결함 0 |

## 진짜 결함 (정정 완료)

- **employees.role / users.role**: DB text 컬럼인데 appRoleEnum 강제 → z.string() (DB Row 1:1)
- **user_consents.document_type**: DB text 인데 legalDocumentTypeEnum 강제 → z.string()
- **audit_logs.request_id**: DB text 인데 uuid 강제 → z.string() (evaluator P2 병합)
- **user_consents.ip_address**: DB nullable inet 인데 non-null → z.string().nullable(). database.ts Row `unknown` 표현(Insert `?` optional 이 단서)이 nullable 을 가렸고 codex 가 마이그레이션/실측으로 정확 검출. **듀얼검증 핵심 성과**.

## false alarm (실측 확인 후 정정 안 함)

| 항목 | 근거 |
|------|------|
| certificate_requests.issued_at "date" | staging information_schema = timestamptz (codex 가 invoices.issued_at=date 와 혼동). isoTimestampSchema 정확 |
| component name PascalCase | OpenAPI 스키마 component 명은 PascalCase 관례. snake_case 는 필드(properties) 요구이며 정확 적용됨 |
| rememberMe camelCase | auth.ts loginSchema(WI-020 입력 폼) 필드, WI-021-1 entity 변환 범위 밖 |
| .flowset/spec/enums.md 없음 | 실제 경로 .flowset/db/enums.md 존재, enum 33종 값 일치 |
| user_consents.ip_address required 잔존 | zod .nullable() = required 유지 + type:[string,null] (필드 존재+값 null). DB nullable 컬럼의 정확한 응답 표현. nullable 필드 3개(tenant_id/ip_address/user_agent) 모두 일관. codex 4차 인정 |

## 최종: PASS (4차) → evaluator PASS 8.75 와 통합 PASS_BOTH
