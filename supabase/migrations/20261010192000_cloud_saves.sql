-- One cloud save per authenticated account for Multiverse Battle.
create table if not exists public.player_cloud_saves (
    user_id uuid primary key references auth.users(id) on delete cascade,
    save_data jsonb not null,
    revision bigint not null default 1 check (revision >= 1),
    updated_at timestamptz not null default clock_timestamp(),
    constraint player_cloud_saves_data_is_object check (jsonb_typeof(save_data) = 'object'),
    constraint player_cloud_saves_data_size check (pg_column_size(save_data) <= 8388608)
);

alter table public.player_cloud_saves enable row level security;

drop policy if exists player_cloud_saves_select_own on public.player_cloud_saves;
create policy player_cloud_saves_select_own
    on public.player_cloud_saves
    for select
    to authenticated
    using ((select auth.uid()) = user_id);

revoke all on table public.player_cloud_saves from public, anon, authenticated;
grant select on table public.player_cloud_saves to authenticated;

create or replace function public.write_player_cloud_save(
    p_save_data jsonb,
    p_expected_updated_at timestamptz default null
)
returns table(updated_at timestamptz, revision bigint)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_uid uuid := auth.uid();
    v_current public.player_cloud_saves%rowtype;
begin
    if v_uid is null then
        raise exception 'auth_required';
    end if;

    if p_save_data is null
       or jsonb_typeof(p_save_data) <> 'object'
       or pg_column_size(p_save_data) > 8388608 then
        raise exception 'cloud_save_invalid';
    end if;

    -- Serialize even first-time writes, when no row exists yet.
    perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));

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
        values (v_uid, p_save_data, 1, clock_timestamp())
        returning * into v_current;
    else
        if p_expected_updated_at is null
           or p_expected_updated_at <> v_current.updated_at then
            raise exception 'cloud_save_conflict';
        end if;

        update public.player_cloud_saves
           set save_data = p_save_data,
               revision = public.player_cloud_saves.revision + 1,
               updated_at = clock_timestamp()
         where user_id = v_uid
         returning * into v_current;
    end if;

    return query select v_current.updated_at, v_current.revision;
end;
$$;

revoke all on function public.write_player_cloud_save(jsonb, timestamptz) from public, anon;
grant execute on function public.write_player_cloud_save(jsonb, timestamptz) to authenticated;
