-- Multiverse Battle: first-stage clans system.
-- Run in the Supabase SQL Editor or apply as a Supabase migration.

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    display_name text not null default 'Игрок'
        check (char_length(display_name) between 1 and 24),
    created_at timestamptz not null default now()
);

create table if not exists public.clans (
    id uuid primary key default gen_random_uuid(),
    name text not null check (char_length(btrim(name)) between 3 and 24),
    tag text not null unique check (tag ~ '^[A-Z0-9]{2,5}$'),
    description text not null default '' check (char_length(description) <= 160),
    owner_id uuid not null references public.profiles(id) on delete cascade,
    created_at timestamptz not null default now()
);

create table if not exists public.clan_members (
    -- A player may be in only one clan at a time.
    user_id uuid primary key references public.profiles(id) on delete cascade,
    clan_id uuid not null references public.clans(id) on delete cascade,
    role text not null default 'member' check (role in ('leader', 'officer', 'member')),
    joined_at timestamptz not null default now()
);

create index if not exists clan_members_clan_id_idx
    on public.clan_members (clan_id, joined_at);

-- Backfill accounts created before this migration.
insert into public.profiles (id, display_name)
select
    u.id,
    left(
        coalesce(
            nullif(btrim(u.raw_user_meta_data ->> 'display_name'), ''),
            nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
            'Игрок'
        ),
        24
    )
from auth.users as u
on conflict (id) do nothing;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.profiles (id, display_name)
    values (
        new.id,
        left(
            coalesce(
                nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
                nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
                'Игрок'
            ),
            24
        )
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_auth_user();

alter table public.profiles enable row level security;
alter table public.clans enable row level security;
alter table public.clan_members enable row level security;

-- Direct writes to clan data are not allowed; clients use checked RPCs.
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.clans from anon, authenticated;
revoke all on table public.clan_members from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (display_name) on table public.profiles to authenticated;
grant select on table public.clans to authenticated;
grant select on table public.clan_members to authenticated;

drop policy if exists profiles_read_by_authenticated on public.profiles;
create policy profiles_read_by_authenticated
on public.profiles for select to authenticated
using (true);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

drop policy if exists clans_read_by_authenticated on public.clans;
create policy clans_read_by_authenticated
on public.clans for select to authenticated
using (true);

drop policy if exists clan_members_read_by_authenticated on public.clan_members;
create policy clan_members_read_by_authenticated
on public.clan_members for select to authenticated
using (true);

create or replace function public.create_clan(
    p_name text,
    p_tag text,
    p_description text default ''
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user_id uuid := auth.uid();
    v_clan_id uuid;
    v_name text := btrim(coalesce(p_name, ''));
    v_tag text := upper(regexp_replace(btrim(coalesce(p_tag, '')), '[^A-Za-z0-9]', '', 'g'));
    v_description text := btrim(coalesce(p_description, ''));
begin
    if v_user_id is null then
        raise exception 'auth_required' using errcode = '28000';
    end if;
    if char_length(v_name) < 3 or char_length(v_name) > 24 then
        raise exception 'invalid_clan_name' using errcode = '22023';
    end if;
    if char_length(v_tag) < 2 or char_length(v_tag) > 5 or v_tag !~ '^[A-Z0-9]+$' then
        raise exception 'invalid_clan_tag' using errcode = '22023';
    end if;
    if char_length(v_description) > 160 then
        raise exception 'description_too_long' using errcode = '22023';
    end if;
    if exists (select 1 from public.clan_members where user_id = v_user_id) then
        raise exception 'already_in_clan' using errcode = '23505';
    end if;

    insert into public.clans (name, tag, description, owner_id)
    values (v_name, v_tag, v_description, v_user_id)
    returning id into v_clan_id;

    insert into public.clan_members (user_id, clan_id, role)
    values (v_user_id, v_clan_id, 'leader');

    return v_clan_id;
end;
$$;

create or replace function public.join_clan(p_clan_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user_id uuid := auth.uid();
begin
    if v_user_id is null then
        raise exception 'auth_required' using errcode = '28000';
    end if;
    if p_clan_id is null or not exists (
        select 1 from public.clans where id = p_clan_id
    ) then
        raise exception 'clan_not_found' using errcode = 'P0002';
    end if;
    if exists (select 1 from public.clan_members where user_id = v_user_id) then
        raise exception 'already_in_clan' using errcode = '23505';
    end if;

    insert into public.clan_members (user_id, clan_id, role)
    values (v_user_id, p_clan_id, 'member');
end;
$$;

create or replace function public.leave_clan()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user_id uuid := auth.uid();
    v_role text;
begin
    if v_user_id is null then
        raise exception 'auth_required' using errcode = '28000';
    end if;

    select role into v_role
    from public.clan_members
    where user_id = v_user_id
    for update;

    if not found then
        raise exception 'not_in_clan' using errcode = 'P0002';
    end if;
    if v_role = 'leader' then
        raise exception 'leader_must_disband' using errcode = '42501';
    end if;

    delete from public.clan_members where user_id = v_user_id;
end;
$$;

create or replace function public.disband_clan(p_clan_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user_id uuid := auth.uid();
begin
    if v_user_id is null then
        raise exception 'auth_required' using errcode = '28000';
    end if;
    if not exists (
        select 1
        from public.clans as c
        join public.clan_members as m on m.clan_id = c.id
        where c.id = p_clan_id
          and c.owner_id = v_user_id
          and m.user_id = v_user_id
          and m.role = 'leader'
    ) then
        raise exception 'leader_only_action' using errcode = '42501';
    end if;

    delete from public.clans where id = p_clan_id;
end;
$$;

-- SECURITY DEFINER functions use an empty search_path and fully qualified tables.
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
revoke all on function public.create_clan(text, text, text) from public, anon, authenticated;
revoke all on function public.join_clan(uuid) from public, anon, authenticated;
revoke all on function public.leave_clan() from public, anon, authenticated;
revoke all on function public.disband_clan(uuid) from public, anon, authenticated;

grant execute on function public.create_clan(text, text, text) to authenticated;
grant execute on function public.join_clan(uuid) to authenticated;
grant execute on function public.leave_clan() to authenticated;
grant execute on function public.disband_clan(uuid) to authenticated;
