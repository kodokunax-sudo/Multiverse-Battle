-- Preserve prior cloud-save revisions before replacing them, and allow explicit transfer
-- to a freshly registered account without deleting the old account's cloud save.

create table if not exists public.player_cloud_save_history (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    revision bigint not null check (revision >= 1),
    save_data jsonb not null check (jsonb_typeof(save_data) = 'object'),
    updated_at timestamptz not null,
    archived_at timestamptz not null default clock_timestamp(),
    reason text not null default 'before_update',
    check (pg_column_size(save_data) <= 8388608)
);

alter table public.player_cloud_save_history enable row level security;
revoke all on table public.player_cloud_save_history from public, anon, authenticated;
create index if not exists player_cloud_save_history_user_archived_idx
    on public.player_cloud_save_history(user_id, archived_at desc);

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

        insert into public.player_cloud_save_history(user_id, revision, save_data, updated_at, reason)
        values (v_uid, v_current.revision, v_current.save_data, v_current.updated_at, 'before_update');

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

drop function if exists public.claim_multiverse_slot_account(uuid, integer);

create function public.claim_multiverse_slot_account(
    p_device_id uuid,
    p_slot_index integer,
    p_transfer_existing_slot boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user_id uuid := auth.uid();
    v_slot_owner uuid;
    v_user_slot integer;
begin
    if v_user_id is null then
        return jsonb_build_object('ok', false, 'message', 'Сначала войди в аккаунт.');
    end if;
    if p_device_id is null or p_slot_index is null or p_slot_index < 0 or p_slot_index > 2 then
        return jsonb_build_object('ok', false, 'message', 'Не удалось проверить устройство или слот.');
    end if;

    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_device_id::text, 0));

    select user_id into v_slot_owner
    from public.multiverse_device_slot_accounts
    where device_id = p_device_id and slot_index = p_slot_index
    for update;

    select slot_index into v_user_slot
    from public.multiverse_device_slot_accounts
    where device_id = p_device_id and user_id = v_user_id
    for update;

    if v_user_slot is not null and v_user_slot <> p_slot_index then
        return jsonb_build_object('ok', false, 'message',
            'Этот аккаунт уже закреплён за слотом ' || (v_user_slot + 1)::text || ' на этом устройстве. На других устройствах этот аккаунт использовать можно.');
    end if;

    if v_slot_owner is not null and v_slot_owner <> v_user_id then
        if p_transfer_existing_slot then
            delete from public.multiverse_device_slot_accounts
            where device_id = p_device_id and slot_index = p_slot_index;
        else
            return jsonb_build_object('ok', false, 'message',
                'Слот ' || (p_slot_index + 1)::text || ' уже закреплён за другим аккаунтом на этом устройстве. Используй аккаунт этого слота.');
        end if;
    end if;

    insert into public.multiverse_device_slot_accounts(device_id, slot_index, user_id)
    values (p_device_id, p_slot_index, v_user_id)
    on conflict (device_id, slot_index) do update
        set user_id = excluded.user_id,
            created_at = pg_catalog.clock_timestamp();

    return jsonb_build_object('ok', true, 'slot_index', p_slot_index, 'transferred', coalesce(p_transfer_existing_slot, false));
end;
$$;

revoke all on function public.claim_multiverse_slot_account(uuid, integer, boolean) from public, anon;
grant execute on function public.claim_multiverse_slot_account(uuid, integer, boolean) to authenticated;
