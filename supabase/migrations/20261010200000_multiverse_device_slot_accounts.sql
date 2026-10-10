-- Enforce one distinct Supabase account per game slot on each device/browser.
-- The same account may be used on another device for cloud sync.
create table if not exists public.multiverse_device_slot_accounts (
    device_id uuid not null,
    slot_index smallint not null check (slot_index between 0 and 2),
    user_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (device_id, slot_index),
    unique (device_id, user_id)
);

alter table public.multiverse_device_slot_accounts enable row level security;
revoke all on public.multiverse_device_slot_accounts from anon, authenticated;
drop policy if exists multiverse_device_slot_accounts_no_direct_access on public.multiverse_device_slot_accounts;
create policy multiverse_device_slot_accounts_no_direct_access
    on public.multiverse_device_slot_accounts
    for all to anon, authenticated
    using (false) with check (false);

create or replace function public.claim_multiverse_slot_account(p_device_id uuid, p_slot_index integer)
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
    where device_id = p_device_id and slot_index = p_slot_index;

    if v_slot_owner is not null and v_slot_owner <> v_user_id then
        return jsonb_build_object('ok', false, 'message',
            'Слот ' || (p_slot_index + 1)::text || ' уже закреплён за другим аккаунтом на этом устройстве. Используй аккаунт этого слота.');
    end if;

    select slot_index into v_user_slot
    from public.multiverse_device_slot_accounts
    where device_id = p_device_id and user_id = v_user_id;

    if v_user_slot is not null and v_user_slot <> p_slot_index then
        return jsonb_build_object('ok', false, 'message',
            'Этот аккаунт уже закреплён за слотом ' || (v_user_slot + 1)::text || ' на этом устройстве. На других устройствах этот аккаунт использовать можно.');
    end if;

    insert into public.multiverse_device_slot_accounts(device_id, slot_index, user_id)
    values (p_device_id, p_slot_index, v_user_id)
    on conflict (device_id, slot_index) do nothing;

    return jsonb_build_object('ok', true, 'slot_index', p_slot_index);
end;
$$;

revoke all on function public.claim_multiverse_slot_account(uuid, integer) from public, anon;
grant execute on function public.claim_multiverse_slot_account(uuid, integer) to authenticated;
