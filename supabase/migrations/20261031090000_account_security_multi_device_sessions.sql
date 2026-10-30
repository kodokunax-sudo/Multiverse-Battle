-- Multi-device account sessions and owner-controlled session revocation.
-- Device IDs are app-generated browser identifiers, not immutable hardware serial numbers.

alter table public.mb_active_account_sessions
    add column if not exists device_label text not null default 'Неизвестное устройство',
    add column if not exists user_agent text not null default '',
    add column if not exists ended_at timestamptz,
    add column if not exists revoked_at timestamptz;

alter table public.mb_active_account_sessions
    drop constraint if exists mb_active_account_sessions_pkey;
alter table public.mb_active_account_sessions
    add constraint mb_active_account_sessions_pkey primary key (user_id, client_session_id);

create index if not exists mb_active_account_sessions_user_seen_idx
    on public.mb_active_account_sessions(user_id, last_seen_at desc);

create table if not exists public.mb_revoked_account_auth_sessions (
    user_id uuid not null references auth.users(id) on delete cascade,
    auth_session_id uuid not null,
    revoked_at timestamptz not null default pg_catalog.clock_timestamp(),
    primary key (user_id, auth_session_id)
);
alter table public.mb_revoked_account_auth_sessions enable row level security;
revoke all on table public.mb_revoked_account_auth_sessions from public, anon, authenticated;

create table if not exists public.mb_banned_devices (
    device_id uuid primary key,
    reason text not null default 'Нарушение правил игры',
    created_at timestamptz not null default pg_catalog.clock_timestamp(),
    created_by uuid references auth.users(id) on delete set null
);
alter table public.mb_banned_devices enable row level security;
revoke all on table public.mb_banned_devices from public, anon, authenticated;

-- Device bans are managed only by trusted server-side code using the service role.
-- The claim function checks this table for every account, with no moderator/admin bypass.
create or replace function public.mb_ban_device(p_device_id uuid, p_reason text default 'Нарушение правил игры')
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
begin
    if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
        raise exception 'service_role_required' using errcode = '42501';
    end if;
    if p_device_id is null then
        raise exception 'device_id_required' using errcode = '22023';
    end if;

    insert into public.mb_banned_devices(device_id, reason)
    values (p_device_id, left(coalesce(nullif(p_reason, ''), 'Нарушение правил игры'), 300))
    on conflict (device_id) do update
       set reason = excluded.reason,
           created_at = pg_catalog.clock_timestamp();

    update public.mb_active_account_sessions
       set revoked_at = pg_catalog.clock_timestamp()
     where device_id = p_device_id and revoked_at is null;

    return jsonb_build_object('ok', true, 'device_id', p_device_id);
end;
$function$;
revoke all on function public.mb_ban_device(uuid, text) from public, anon, authenticated;
grant execute on function public.mb_ban_device(uuid, text) to service_role;

drop function if exists public.mb_claim_active_account_session(uuid, uuid, uuid);

create or replace function public.mb_claim_active_account_session(
    p_session_id uuid,
    p_auth_session_id uuid,
    p_device_id uuid,
    p_device_label text default 'Неизвестное устройство',
    p_user_agent text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
    v_uid uuid := auth.uid();
    v_token_session_id uuid := nullif(auth.jwt() ->> 'session_id', '')::uuid;
    v_now timestamptz := pg_catalog.clock_timestamp();
begin
    if v_uid is null then
        return jsonb_build_object('ok', false, 'code', 'auth_required');
    end if;
    if p_session_id is null or p_device_id is null or v_token_session_id is null
       or p_auth_session_id is distinct from v_token_session_id then
        return jsonb_build_object('ok', false, 'code', 'invalid_session');
    end if;

    if exists (
        select 1 from public.mb_banned_devices b where b.device_id = p_device_id
    ) then
        return jsonb_build_object('ok', false, 'code', 'device_banned',
            'message', 'Это устройство заблокировано для входа в Multiverse Battle.');
    end if;

    if exists (
        select 1 from public.mb_revoked_account_auth_sessions r
         where r.user_id = v_uid and r.auth_session_id = v_token_session_id
    ) then
        return jsonb_build_object('ok', false, 'code', 'session_revoked',
            'message', 'Эта сессия отключена владельцем аккаунта. Войди заново.');
    end if;

    insert into public.mb_active_account_sessions(
        user_id, client_session_id, auth_session_id, device_id,
        device_label, user_agent, started_at, last_seen_at, ended_at, revoked_at
    )
    values (
        v_uid, p_session_id, v_token_session_id, p_device_id,
        left(coalesce(nullif(p_device_label, ''), 'Неизвестное устройство'), 80),
        left(coalesce(p_user_agent, ''), 500), v_now, v_now, null, null
    )
    on conflict (user_id, client_session_id) do update
       set auth_session_id = excluded.auth_session_id,
           device_id = excluded.device_id,
           device_label = excluded.device_label,
           user_agent = excluded.user_agent,
           last_seen_at = excluded.last_seen_at,
           ended_at = null,
           revoked_at = null,
           started_at = case
               when public.mb_active_account_sessions.auth_session_id = excluded.auth_session_id
               then public.mb_active_account_sessions.started_at
               else excluded.started_at
           end;

    return jsonb_build_object('ok', true, 'session_id', p_session_id, 'started_at', v_now);
end;
$function$;

create or replace function public.mb_heartbeat_active_account_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
    v_uid uuid := auth.uid();
    v_token_session_id uuid := nullif(auth.jwt() ->> 'session_id', '')::uuid;
    v_now timestamptz := pg_catalog.clock_timestamp();
begin
    if v_uid is null or p_session_id is null or v_token_session_id is null then
        return jsonb_build_object('ok', false, 'code', 'active_session_lost');
    end if;

    if exists (
        select 1 from public.mb_active_account_sessions s
         where s.user_id = v_uid
           and s.client_session_id = p_session_id
           and s.auth_session_id = v_token_session_id
           and s.revoked_at is not null
    ) or exists (
        select 1 from public.mb_revoked_account_auth_sessions r
         where r.user_id = v_uid and r.auth_session_id = v_token_session_id
    ) then
        return jsonb_build_object('ok', false, 'code', 'session_revoked');
    end if;

    update public.mb_active_account_sessions
       set last_seen_at = v_now
     where user_id = v_uid
       and client_session_id = p_session_id
       and auth_session_id = v_token_session_id
       and ended_at is null
       and revoked_at is null
       and last_seen_at >= v_now - interval '3 minutes';

    if not found then
        return jsonb_build_object('ok', false, 'code', 'active_session_lost');
    end if;
    return jsonb_build_object('ok', true, 'last_seen_at', v_now);
end;
$function$;

create or replace function public.mb_release_active_account_session(p_session_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
    v_uid uuid := auth.uid();
    v_token_session_id uuid := nullif(auth.jwt() ->> 'session_id', '')::uuid;
begin
    if v_uid is null or p_session_id is null or v_token_session_id is null then
        return false;
    end if;

    update public.mb_active_account_sessions
       set ended_at = pg_catalog.clock_timestamp()
     where user_id = v_uid
       and client_session_id = p_session_id
       and auth_session_id = v_token_session_id
       and ended_at is null;
    return found;
end;
$function$;

create or replace function public.mb_list_account_devices(p_current_session_id uuid default null)
returns table(
    client_session_id uuid,
    device_id uuid,
    device_label text,
    user_agent text,
    started_at timestamptz,
    last_seen_at timestamptz,
    ended_at timestamptz,
    revoked_at timestamptz,
    is_current boolean
)
language sql
security definer
set search_path = ''
as $function$
    select s.client_session_id, s.device_id, s.device_label, s.user_agent,
           s.started_at, s.last_seen_at, s.ended_at, s.revoked_at,
           (s.client_session_id = p_current_session_id)
      from public.mb_active_account_sessions s
     where s.user_id = auth.uid()
       and s.started_at >= pg_catalog.clock_timestamp() - interval '90 days'
     order by s.last_seen_at desc
     limit 50;
$function$;

create or replace function public.mb_revoke_account_session(p_target_client_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
    v_uid uuid := auth.uid();
    v_token_session_id uuid := nullif(auth.jwt() ->> 'session_id', '')::uuid;
    v_target_auth_session_id uuid;
    v_has_otp boolean;
begin
    if v_uid is null or v_token_session_id is null then
        return jsonb_build_object('ok', false, 'code', 'auth_required');
    end if;

    select exists (
        select 1
          from pg_catalog.jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) a
         where a ->> 'method' = 'otp'
    ) into v_has_otp;
    if not v_has_otp then
        return jsonb_build_object('ok', false, 'code', 'email_verification_required',
            'message', 'Подтверди почту одноразовым кодом, чтобы отключить устройство.');
    end if;

    select s.auth_session_id into v_target_auth_session_id
      from public.mb_active_account_sessions s
     where s.user_id = v_uid
       and s.client_session_id = p_target_client_session_id
       and s.ended_at is null
       and s.revoked_at is null
     for update;

    if not found then
        return jsonb_build_object('ok', false, 'code', 'session_not_found');
    end if;
    if v_target_auth_session_id = v_token_session_id then
        return jsonb_build_object('ok', false, 'code', 'cannot_revoke_current',
            'message', 'Нельзя отключить сессию, с которой подтверждается действие.');
    end if;

    insert into public.mb_revoked_account_auth_sessions(user_id, auth_session_id)
    values (v_uid, v_target_auth_session_id)
    on conflict (user_id, auth_session_id) do nothing;

    update public.mb_active_account_sessions
       set revoked_at = pg_catalog.clock_timestamp()
     where user_id = v_uid
       and auth_session_id = v_target_auth_session_id
       and revoked_at is null;

    return jsonb_build_object('ok', true);
end;
$function$;

create or replace function public.read_player_cloud_save(p_session_id uuid)
returns table(save_data jsonb, updated_at timestamptz, revision bigint)
language plpgsql
security definer
set search_path = ''
as $function$
declare
    v_uid uuid := auth.uid();
    v_token_session_id uuid := nullif(auth.jwt() ->> 'session_id', '')::uuid;
    v_now timestamptz := pg_catalog.clock_timestamp();
begin
    if v_uid is null then raise exception 'auth_required' using errcode = '28000'; end if;

    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text, 0));
    perform 1
      from public.mb_active_account_sessions s
     where s.user_id = v_uid
       and s.client_session_id = p_session_id
       and s.auth_session_id = v_token_session_id
       and s.ended_at is null and s.revoked_at is null
       and s.last_seen_at >= v_now - interval '3 minutes'
     for update;
    if not found then raise exception 'active_session_required' using errcode = '42501'; end if;

    return query select c.save_data, c.updated_at, c.revision
      from public.player_cloud_saves c where c.user_id = v_uid;
end;
$function$;

create or replace function public.write_player_cloud_save(
    p_save_data jsonb,
    p_expected_updated_at timestamptz default null,
    p_session_id uuid default null
)
returns table(updated_at timestamptz, revision bigint)
language plpgsql
security definer
set search_path = pg_catalog, auth
as $function$
declare
    v_uid uuid := auth.uid();
    v_token_session_id uuid := nullif(auth.jwt() ->> 'session_id', '')::uuid;
    v_now timestamptz := pg_catalog.clock_timestamp();
    v_current public.player_cloud_saves%rowtype;
begin
    if v_uid is null then raise exception 'auth_required'; end if;
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text, 0));

    perform 1
      from public.mb_active_account_sessions s
     where s.user_id = v_uid
       and s.client_session_id = p_session_id
       and s.auth_session_id = v_token_session_id
       and s.ended_at is null and s.revoked_at is null
       and s.last_seen_at >= v_now - interval '3 minutes'
     for update;
    if not found then raise exception 'active_session_required' using errcode = '42501'; end if;

    if p_save_data is null
       or pg_catalog.jsonb_typeof(p_save_data) <> 'object'
       or pg_catalog.pg_column_size(p_save_data) > 8388608 then
        raise exception 'cloud_save_invalid' using errcode = '22023';
    end if;

    select * into v_current from public.player_cloud_saves where user_id = v_uid for update;
    if not found then
        if p_expected_updated_at is not null then raise exception 'cloud_save_conflict'; end if;
        insert into public.player_cloud_saves(user_id, save_data, revision, updated_at)
        values (v_uid, p_save_data, 1, v_now) returning * into v_current;
    else
        if p_expected_updated_at is null or p_expected_updated_at <> v_current.updated_at then
            raise exception 'cloud_save_conflict';
        end if;
        insert into public.player_cloud_save_history(user_id, revision, save_data, updated_at, reason)
        values (v_uid, v_current.revision, v_current.save_data, v_current.updated_at, 'before_update');
        update public.player_cloud_saves
           set save_data = p_save_data,
               revision = public.player_cloud_saves.revision + 1,
               updated_at = v_now
         where user_id = v_uid returning * into v_current;
    end if;
    return query select v_current.updated_at, v_current.revision;
end;
$function$;

revoke all on function public.mb_claim_active_account_session(uuid, uuid, uuid) from public, anon;
revoke all on function public.mb_claim_active_account_session(uuid, uuid, uuid, text, text) from public, anon;
revoke all on function public.mb_heartbeat_active_account_session(uuid) from public, anon;
revoke all on function public.mb_release_active_account_session(uuid) from public, anon;
revoke all on function public.mb_list_account_devices(uuid) from public, anon;
revoke all on function public.mb_revoke_account_session(uuid) from public, anon;
revoke all on function public.read_player_cloud_save(uuid) from public, anon;
revoke all on function public.write_player_cloud_save(jsonb, timestamptz, uuid) from public, anon;

grant execute on function public.mb_claim_active_account_session(uuid, uuid, uuid, text, text) to authenticated;
grant execute on function public.mb_heartbeat_active_account_session(uuid) to authenticated;
grant execute on function public.mb_release_active_account_session(uuid) to authenticated;
grant execute on function public.mb_list_account_devices(uuid) to authenticated;
grant execute on function public.mb_revoke_account_session(uuid) to authenticated;
grant execute on function public.read_player_cloud_save(uuid) to authenticated;
grant execute on function public.write_player_cloud_save(jsonb, timestamptz, uuid) to authenticated;
