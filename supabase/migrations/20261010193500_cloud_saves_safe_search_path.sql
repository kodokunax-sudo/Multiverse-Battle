-- Keep the cloud-save SECURITY DEFINER function's search_path away from public.
create or replace function public.write_player_cloud_save(
    p_save_data jsonb,
    p_expected_updated_at timestamptz default null
)
returns table(updated_at timestamptz, revision bigint)
language plpgsql
security definer
set search_path = pg_catalog, auth
as $$
declare
    v_uid uuid := auth.uid();
    v_current public.player_cloud_saves%rowtype;
begin
    if v_uid is null then
        raise exception 'auth_required';
    end if;

    if p_save_data is null
       or pg_catalog.jsonb_typeof(p_save_data) <> 'object'
       or pg_catalog.pg_column_size(p_save_data) > 8388608 then
        raise exception 'cloud_save_invalid';
    end if;

    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text, 0));

    select *
      into v_current
      from public.player_cloud_saves
     where user_id = v_uid
     for update;

    if not found then
        if p_expected_updated_at is not null then
            raise exception 'cloud_save_conflict';
        end if;

        insert into public.player_cloud_saves(user_id, save_data, revision, updated_at)
        values (v_uid, p_save_data, 1, pg_catalog.clock_timestamp())
        returning * into v_current;
    else
        if p_expected_updated_at is null
           or p_expected_updated_at <> v_current.updated_at then
            raise exception 'cloud_save_conflict';
        end if;

        update public.player_cloud_saves
           set save_data = p_save_data,
               revision = public.player_cloud_saves.revision + 1,
               updated_at = pg_catalog.clock_timestamp()
         where user_id = v_uid
         returning * into v_current;
    end if;

    return query select v_current.updated_at, v_current.revision;
end;
$$;

revoke all on function public.write_player_cloud_save(jsonb, timestamptz) from public, anon;
grant execute on function public.write_player_cloud_save(jsonb, timestamptz) to authenticated;
