-- One active game instance per account, plus session-bound cloud save reads/writes.
create table if not exists public.mb_active_account_sessions (
    user_id uuid primary key references auth.users(id) on delete cascade,
    client_session_id uuid not null,
    auth_session_id uuid not null,
    device_id uuid not null,
    started_at timestamptz not null default pg_catalog.clock_timestamp(),
    last_seen_at timestamptz not null default pg_catalog.clock_timestamp()
);

alter table public.mb_active_account_sessions enable row level security;
revoke all on table public.mb_active_account_sessions from public, anon, authenticated;

create index if not exists mb_active_account_sessions_last_seen_idx
    on public.mb_active_account_sessions(last_seen_at);

create or replace function public.mb_claim_active_account_session(
    p_session_id uuid,
    p_auth_session_id uuid,
    p_device_id uuid
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
    v_existing public.mb_active_account_sessions%rowtype;
begin
    if v_uid is null then
        return jsonb_build_object('ok', false, 'code', 'auth_required', 'message', 'Сначала войди в аккаунт.');
    end if;
    if p_session_id is null or p_device_id is null or v_token_session_id is null
       or p_auth_session_id is distinct from v_token_session_id then
        return jsonb_build_object('ok', false, 'code', 'invalid_session', 'message', 'Не удалось проверить сессию аккаунта. Перезайди в игру.');
    end if;

    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text, 0));

    select s.* into v_existing
      from public.mb_active_account_sessions s
     where s.user_id = v_uid
     for update;

    if found
       and v_existing.last_seen_at >= v_now - interval '90 seconds'
       and (v_existing.client_session_id <> p_session_id
            or v_existing.auth_session_id <> v_token_session_id) then
        return jsonb_build_object(
            'ok', false,
            'code', 'active_session_in_use',
            'message', 'Этот аккаунт уже открыт в другой игре. Закрой игру на другом устройстве или вкладке, затем нажми «Проверить снова».'
        );
    end if;

    insert into public.mb_active_account_sessions(
        user_id, client_session_id, auth_session_id, device_id, started_at, last_seen_at
    )
    values (v_uid, p_session_id, v_token_session_id, p_device_id, v_now, v_now)
    on conflict (user_id) do update
       set client_session_id = excluded.client_session_id,
           auth_session_id = excluded.auth_session_id,
           device_id = excluded.device_id,
           started_at = case
               when public.mb_active_account_sessions.client_session_id = excluded.client_session_id
                and public.mb_active_account_sessions.auth_session_id = excluded.auth_session_id
               then public.mb_active_account_sessions.started_at
               else excluded.started_at
           end,
           last_seen_at = excluded.last_seen_at;

    return jsonb_build_object('ok', true, 'session_id', p_session_id, 'started_at', coalesce(v_existing.started_at, v_now));
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

    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text, 0));

    update public.mb_active_account_sessions
       set last_seen_at = v_now
     where user_id = v_uid
       and client_session_id = p_session_id
       and auth_session_id = v_token_session_id
       and last_seen_at >= v_now - interval '90 seconds';

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

    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text, 0));

    delete from public.mb_active_account_sessions
     where user_id = v_uid
       and client_session_id = p_session_id
       and auth_session_id = v_token_session_id;

    return found;
end;
$function$;

revoke all on function public.mb_claim_active_account_session(uuid, uuid, uuid) from public, anon;
revoke all on function public.mb_heartbeat_active_account_session(uuid) from public, anon;
revoke all on function public.mb_release_active_account_session(uuid) from public, anon;
grant execute on function public.mb_claim_active_account_session(uuid, uuid, uuid) to authenticated;
grant execute on function public.mb_heartbeat_active_account_session(uuid) to authenticated;
grant execute on function public.mb_release_active_account_session(uuid) to authenticated;

create or replace function public.read_player_cloud_save(p_session_id uuid)
returns table(save_data jsonb, updated_at timestamptz, revision bigint)
language plpgsql
security definer
set search_path = ''
as $function$
declare
    v_uid uuid := auth.uid();
    v_token_session_id uuid := nullif(auth.jwt() ->> 'session_id', '')::uuid;
    v_locked_session_id uuid;
    v_now timestamptz := pg_catalog.clock_timestamp();
begin
    if v_uid is null then
        raise exception 'auth_required' using errcode = '28000';
    end if;

    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text, 0));

    select s.client_session_id into v_locked_session_id
      from public.mb_active_account_sessions s
     where s.user_id = v_uid
       and s.client_session_id = p_session_id
       and s.auth_session_id = v_token_session_id
       and s.last_seen_at >= v_now - interval '90 seconds'
     for update;

    if not found then
        raise exception 'active_session_required' using errcode = '42501';
    end if;

    return query
    select c.save_data, c.updated_at, c.revision
      from public.player_cloud_saves c
     where c.user_id = v_uid;
end;
$function$;

revoke all on function public.read_player_cloud_save(uuid) from public, anon;
grant execute on function public.read_player_cloud_save(uuid) to authenticated;
revoke all on table public.player_cloud_saves from public, anon, authenticated;

drop function if exists public.write_player_cloud_save(jsonb, timestamptz);

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
    v_locked_session_id uuid;
    v_current public.player_cloud_saves%rowtype;
begin
    if v_uid is null then
        raise exception 'auth_required';
    end if;

    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text, 0));

    select s.client_session_id into v_locked_session_id
      from public.mb_active_account_sessions s
     where s.user_id = v_uid
       and s.client_session_id = p_session_id
       and s.auth_session_id = v_token_session_id
       and s.last_seen_at >= v_now - interval '90 seconds'
     for update;

    if not found then
        raise exception 'active_session_required' using errcode = '42501';
    end if;

    if p_save_data is null
       or pg_catalog.jsonb_typeof(p_save_data) <> 'object'
       or pg_catalog.pg_column_size(p_save_data) > 8388608 then
        raise exception 'cloud_save_invalid' using errcode = '22023';
    end if;

    select * into v_current
      from public.player_cloud_saves
     where user_id = v_uid
     for update;

    if not found then
        if p_expected_updated_at is not null then
            raise exception 'cloud_save_conflict';
        end if;

        insert into public.player_cloud_saves(user_id, save_data, revision, updated_at)
        values (v_uid, p_save_data, 1, v_now)
        returning * into v_current;
    else
        if p_expected_updated_at is null
           or p_expected_updated_at <> v_current.updated_at then
            raise exception 'cloud_save_conflict';
        end if;

        insert into public.player_cloud_save_history(user_id, revision, save_data, updated_at, reason)
        values (v_uid, v_current.revision, v_current.save_data, v_current.updated_at, 'before_update');

        update public.player_cloud_saves
           set save_data = p_save_data,
               revision = public.player_cloud_saves.revision + 1,
               updated_at = v_now
         where user_id = v_uid
         returning * into v_current;
    end if;

    return query select v_current.updated_at, v_current.revision;
end;
$function$;

revoke all on function public.write_player_cloud_save(jsonb, timestamptz, uuid) from public, anon;
grant execute on function public.write_player_cloud_save(jsonb, timestamptz, uuid) to authenticated;
