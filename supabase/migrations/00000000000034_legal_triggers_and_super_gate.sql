-- ST-078 약관/동의 하드닝 (SSOT: .flowset/db/rls.md §6-1, KI-030 batch-003)
--
-- migration 20 주석이 ST-078로 미룬 두 트리거를 추가하고, 게시 권한을 operator_super로 좁힌다.
-- (1) legal_documents_ensure_single_active — (type, language)별 active 1행 자동 보장.
--     partial unique index(idx_legal_docs_active_per_type_lang)와 이중 보호: 트리거가
--     기존 active를 자동 false 전환 + index가 race 시 INSERT 차단.
-- (2) user_consents_block_modify — 동의 기록 불변(PIPA 컴플라이언스 로그). RLS no_update/no_delete
--     (using false)는 일반 role만 차단하므로, service_role 우회까지 막는 BEFORE UPDATE/DELETE 안전망.
-- (3) legal_documents 게시(insert/update/delete) RLS를 is_operator() → is_operator_super().
--     ST-078 AC-4 + api/common.md(POST /operator/legal/documents = operator_super 전용) 정합.
--     read 정책(legal_docs_read)은 그대로 — operator_staff 도 조회/감사는 가능.
-- search_path 고정은 migration 31 하드닝 패턴(public, pg_catalog)을 따른다.

-- =====================================================================
-- (1) legal_documents 단일 active 보장 트리거 (language 차원 포함, i18n batch-005)
-- =====================================================================

create or replace function legal_documents_ensure_single_active() returns trigger
  language plpgsql set search_path = public, pg_catalog as $$
  begin
    if new.is_active = true then
      update legal_documents
        set is_active = false, updated_at = now()
        where type = new.type
          and language = new.language       -- i18n: ko/en 별도 active 유지
          and id <> new.id
          and is_active = true;
    end if;
    return new;
  end;
$$;

create trigger legal_documents_single_active
  before insert or update on legal_documents
  for each row execute function legal_documents_ensure_single_active();

-- =====================================================================
-- (2) user_consents 불변 강제 트리거 (service_role 우회까지 차단)
-- =====================================================================

create or replace function user_consents_block_modify() returns trigger
  language plpgsql set search_path = public, pg_catalog as $$
  begin
    raise exception 'user_consents are immutable (compliance log)';
  end;
$$;

create trigger user_consents_block_update
  before update or delete on user_consents
  for each row execute function user_consents_block_modify();

-- 트리거 전용 함수 — anon/authenticated RPC 노출 차단 (migration 31 패턴).
revoke execute on function legal_documents_ensure_single_active() from public, anon, authenticated;
revoke execute on function user_consents_block_modify() from public, anon, authenticated;

-- =====================================================================
-- (3) legal_documents 게시 권한 operator_super 로 축소 (R1, AC-4)
-- =====================================================================

drop policy legal_docs_insert on legal_documents;
drop policy legal_docs_update on legal_documents;
drop policy legal_docs_delete on legal_documents;

create policy legal_docs_insert on legal_documents for insert
  with check (is_operator_super());
create policy legal_docs_update on legal_documents for update
  using (is_operator_super()) with check (is_operator_super());
create policy legal_docs_delete on legal_documents for delete
  using (is_operator_super());
