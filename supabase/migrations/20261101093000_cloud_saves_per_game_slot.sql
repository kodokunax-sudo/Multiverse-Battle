-- Keep each of a player's five game slots in an independent cloud row.
-- Existing one-row-per-account saves are preserved as slot 0 (the visible first slot).
-- Existing history is also assigned to slot 0 because its old format had no slot identity.

alter table public.player_cloud_saves
    add column if not exists slot_index integer not null default 0;

alter table public.player_cloud_saves
    add constraint player_cloud_saves_slot_index_check
    check (slot_index between 0 and 4);

alter table public.player_cloud_saves
    drop constraint if exists player_cloud_saves_pkey;

alter table public.player_cloud_saves
    add constraint player_cloud_saves_pkey primary key (user_id, slot_index);

alter table public.player_cloud_save_history
    add column if not exists slot_index integer not null default 0;

alter table public.player_cloud_save_history
    add constraint player_cloud_save_history_slot_index_check
    check (slot_index between 0 and 4);

create index if not exists player_cloud_save_history_user_slot_archived_idx
    on public.player_cloud_save_history (user_id, slot_index, archived_at desc);

drop function if exists public.read_player_cloud_save(uuid);

create function public.read_player_cloud_save(
    p_session_id uuid,
    p_slot_index integer default 0
)
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

    if p_slot_index is null or p_slot_index < 0 or p_slot_index > 4 then
        raise exception 'cloud_save_slot_invalid' using errcode = '22023';
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
     where c.user_id = v_uid
       and c.slot_index = p_slot_index;
end;
$function$;

revoke all on function public.read_player_cloud_save(uuid, integer) from public, anon;
grant execute on function public.read_player_cloud_save(uuid, integer) to authenticated;

drop function if exists public.write_player_cloud_save(jsonb, timestamptz, uuid);

create function public.write_player_cloud_save(
    p_save_data jsonb,
    p_expected_updated_at timestamptz default null,
    p_session_id uuid default null,
    p_slot_index integer default 0
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

    if p_slot_index is null or p_slot_index < 0 or p_slot_index > 4 then
        raise exception 'cloud_save_slot_invalid' using errcode = '22023';
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
       and slot_index = p_slot_index
     for update;

    if not found then
        if p_expected_updated_at is not null then
            raise exception 'cloud_save_conflict';
        end if;

        insert into public.player_cloud_saves(user_id, slot_index, save_data, revision, updated_at)
        values (v_uid, p_slot_index, p_save_data, 1, v_now)
        returning * into v_current;
    else
        if p_expected_updated_at is null
           or p_expected_updated_at <> v_current.updated_at then
            raise exception 'cloud_save_conflict';
        end if;

        insert into public.player_cloud_save_history(user_id, slot_index, revision, save_data, updated_at, reason)
        values (v_uid, p_slot_index, v_current.revision, v_current.save_data, v_current.updated_at, 'before_update');

        update public.player_cloud_saves
           set save_data = p_save_data,
               revision = public.player_cloud_saves.revision + 1,
               updated_at = v_now
         where user_id = v_uid
           and slot_index = p_slot_index
         returning * into v_current;
    end if;

    return query select v_current.updated_at, v_current.revision;
end;
$function$;

revoke all on function public.write_player_cloud_save(jsonb, timestamptz, uuid, integer) from public, anon;
grant execute on function public.write_player_cloud_save(jsonb, timestamptz, uuid, integer) to authenticated;

notify pgrst, 'reload schema';
