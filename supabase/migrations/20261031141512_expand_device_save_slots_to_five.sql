-- Expand per-device save slots from three (0..2) to five (0..4).
-- Existing slot bindings are preserved; this only permits the two new indexes.

alter table public.multiverse_device_slot_accounts
    drop constraint if exists multiverse_device_slot_accounts_slot_index_check;

alter table public.multiverse_device_slot_accounts
    add constraint multiverse_device_slot_accounts_slot_index_check
    check (slot_index between 0 and 4);

create or replace function public.claim_multiverse_slot_account(
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
    if p_device_id is null or p_slot_index is null or p_slot_index < 0 or p_slot_index > 4 then
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
