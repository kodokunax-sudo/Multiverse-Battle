-- Reject severe cloud-save regressions before they can overwrite an established save.
-- This is a server-side guard, so stale clients and background syncs are protected too.

create or replace function public.write_player_cloud_save(
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
    v_current_cards integer := 0;
    v_incoming_cards integer := 0;
    v_current_team integer := 0;
    v_incoming_team integer := 0;
    v_current_rebirth integer := 0;
    v_incoming_rebirth integer := 0;
    v_current_wave numeric := 1;
    v_incoming_wave numeric := 1;
    v_current_record numeric := 0;
    v_incoming_record numeric := 0;
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

    if found then
        v_current_cards := coalesce(pg_catalog.jsonb_array_length(
            case when pg_catalog.jsonb_typeof(v_current.save_data->'myCards') = 'array'
                 then v_current.save_data->'myCards' else '[]'::jsonb end), 0);
        v_incoming_cards := coalesce(pg_catalog.jsonb_array_length(
            case when pg_catalog.jsonb_typeof(p_save_data->'myCards') = 'array'
                 then p_save_data->'myCards' else '[]'::jsonb end), 0);
        v_current_team := coalesce(pg_catalog.jsonb_array_length(
            case when pg_catalog.jsonb_typeof(v_current.save_data->'team') = 'array'
                 then v_current.save_data->'team' else '[]'::jsonb end), 0);
        v_incoming_team := coalesce(pg_catalog.jsonb_array_length(
            case when pg_catalog.jsonb_typeof(p_save_data->'team') = 'array'
                 then p_save_data->'team' else '[]'::jsonb end), 0);
        v_current_rebirth := coalesce((v_current.save_data->>'rebirthCount')::integer, 0);
        v_incoming_rebirth := coalesce((p_save_data->>'rebirthCount')::integer, 0);
        v_current_wave := coalesce((v_current.save_data->>'wave')::numeric, 1);
        v_incoming_wave := coalesce((p_save_data->>'wave')::numeric, 1);
        v_current_record := coalesce((v_current.save_data->>'highestWaveReached')::numeric, 0);
        v_incoming_record := coalesce((p_save_data->>'highestWaveReached')::numeric, 0);

        if (
            v_current_cards >= v_incoming_cards + 5
            and v_current_cards >= greatest(5, v_incoming_cards * 1.5)
            and v_current_team >= v_incoming_team + 2
        ) or (
            v_current_rebirth > v_incoming_rebirth
            and v_current_cards >= v_incoming_cards
            and v_current_team >= v_incoming_team
        ) or (
            v_current_cards >= v_incoming_cards
            and v_current_team >= v_incoming_team
            and (
                v_current_wave >= v_incoming_wave + 300
                or v_current_record >= v_incoming_record + 500
            )
        ) then
            raise exception 'cloud_save_regression_rejected'
                using errcode = '23514',
                      detail = 'Incoming save is substantially weaker than the existing cloud save. Existing progress was preserved.';
        end if;

        if p_expected_updated_at is null or p_expected_updated_at <> v_current.updated_at then
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
    else
        if p_expected_updated_at is not null then
            raise exception 'cloud_save_conflict';
        end if;

        insert into public.player_cloud_saves(user_id, slot_index, save_data, revision, updated_at)
        values (v_uid, p_slot_index, p_save_data, 1, v_now)
        returning * into v_current;
    end if;

    return query select v_current.updated_at, v_current.revision;
end;
$function$;

revoke all on function public.write_player_cloud_save(jsonb, timestamptz, uuid, integer) from public, anon;
grant execute on function public.write_player_cloud_save(jsonb, timestamptz, uuid, integer) to authenticated;

notify pgrst, 'reload schema';
