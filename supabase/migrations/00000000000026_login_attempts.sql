-- login_attempts: (email, ip) 페어 로그인 실패 추적 + 5회 5분 잠금
-- SSOT: .flowset/api/auth.md §POST /api/v1/auth/login ("5회 실패 시 (email, ip) 페어 5분 잠금")
-- 접근 정책: RLS 활성 + 정책 0개 → anon/authenticated 직접 접근 차단.
--           서버(service_role)만 record_login_failure() 함수 또는 직접 쿼리로 조작.
--           reset/clear를 클라이언트에 노출하면 잠금 우회가 가능하므로 서버 전용으로 잠근다.

create table login_attempts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  ip text not null,
  attempt_count int not null default 0,
  window_started_at timestamptz not null default now(),
  locked_until timestamptz,
  updated_at timestamptz not null default now(),
  unique (email, ip)
);

create index idx_login_attempts_locked_until on login_attempts (locked_until);

alter table login_attempts enable row level security;
-- 정책 미정의 = anon/authenticated 전면 차단. service_role(서버)만 접근.

-- 실패 1건 원자적 기록 + 임계(5회) 도달 시 5분 잠금.
-- 윈도우(15분) 경과 시 카운트 리셋 → 오래된 실패 누적 방지.
-- 반환: 갱신된 attempt_count + locked_until(잠금 없으면 null).
create or replace function record_login_failure(p_email text, p_ip text)
returns table (out_attempt_count int, out_locked_until timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  c_threshold constant int := 5;
  c_lock constant interval := interval '5 minutes';
  c_window constant interval := interval '15 minutes';
  v_count int;
  v_locked timestamptz;
begin
  insert into login_attempts as la (email, ip, attempt_count, window_started_at, updated_at)
  values (p_email, p_ip, 1, now(), now())
  on conflict (email, ip) do update set
    attempt_count = case
      when la.window_started_at < now() - c_window then 1
      else la.attempt_count + 1
    end,
    window_started_at = case
      when la.window_started_at < now() - c_window then now()
      else la.window_started_at
    end,
    updated_at = now()
  returning la.attempt_count into v_count;

  if v_count >= c_threshold then
    update login_attempts
      set locked_until = now() + c_lock, updated_at = now()
      where email = p_email and ip = p_ip
      returning locked_until into v_locked;
  else
    select locked_until into v_locked
      from login_attempts where email = p_email and ip = p_ip;
  end if;

  out_attempt_count := v_count;
  out_locked_until := v_locked;
  return next;
end;
$$;

revoke all on function record_login_failure(text, text) from public;
grant execute on function record_login_failure(text, text) to service_role;
