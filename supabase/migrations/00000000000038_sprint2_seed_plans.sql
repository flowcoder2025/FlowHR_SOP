-- Sprint 2 — 요금제(plans) baseline seed (WI-031)
-- SSOT: OP-04 마법사 3단계 요금제(.flowset/wireframes/html/OP-04.html L191-193, Phase 5 PASS)
--       + .flowset/prd/domains/operator/OP-04-onboarding.md (기본/프리미엄/커스텀)
-- 가격 모델 = **순수 per-user**(기본료 없음). 기본 ₩9,900/명/월, 프리미엄 ₩19,800/명/월, 커스텀 협의.
-- "최대 50/200명"은 plans 스키마 외 티어 설명 — 실제 계약 인원은 tenants.user_limit(OP-04 계약 인원)로 관리.
-- plans는 현재 0행 → OP-04 GET /plans / OP-02 요금제 필터가 읽을 기준 데이터.
-- on conflict(slug) upsert로 멱등 — 재적용 안전.

set search_path = public, extensions;

insert into plans (
  slug, name, base_price_krw, per_user_price_krw, included_users, modules, status, is_public, sort_order
)
values
  ('basic',   '기본',     null, 9900,  null,
   array['attendance', 'leave', 'approval'],                                          'active', true, 10),
  ('premium', '프리미엄', null, 19800, null,
   array['attendance', 'leave', 'approval', 'payroll', 'documents'],                  'active', true, 20),
  ('custom',  '커스텀',   null, null,  null,
   array['attendance', 'leave', 'approval', 'payroll', 'documents', 'integrations'],  'custom', true, 30)
on conflict (slug) do update
   set name              = excluded.name,
       base_price_krw    = excluded.base_price_krw,
       per_user_price_krw = excluded.per_user_price_krw,
       included_users    = excluded.included_users,
       modules           = excluded.modules,
       status            = excluded.status,
       is_public         = excluded.is_public,
       sort_order        = excluded.sort_order,
       updated_at        = now();
