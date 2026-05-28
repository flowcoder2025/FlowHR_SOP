-- 확장 (SSOT: .flowset/db/migrations.md file 1)
-- gen_random_uuid()는 PG13+ core 제공 → 별도 확장 불필요.
-- pgcrypto: 향후 암호화 헬퍼, pg_trgm: 이름/텍스트 검색.
create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "pg_trgm" with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;
