-- Social online layer: friend codes, relationships, presence, clan invites and profile cosmetics.
alter table public.profiles
    add column if not exists friend_code text,
    add column if not exists active_title text not null default '',
    add column if not exists showcase_cards jsonb not null default '[]'::jsonb;

update public.profiles
set friend_code = upper(substr(replace(id::text, '-', ''), 1, 10))
where friend_code is null or btrim(friend_code) = '';
alter table public.profiles alter column friend_code set not null;

do $$
begin
    if not exists (select 1 from pg_catalog.pg_constraint where conname='profiles_active_title_length' and conrelid='public.profiles'::regclass) then
        alter table public.profiles add constraint profiles_active_title_length check (char_length(active_title) <= 80);
    end if;
    if not exists (select 1 from pg_catalog.pg_constraint where conname='profiles_showcase_cards_valid' and conrelid='public.profiles'::regclass) then
        alter table public.profiles add constraint profiles_showcase_cards_valid check (
            pg_catalog.jsonb_typeof(showcase_cards)='array'
            and pg_catalog.jsonb_array_length(showcase_cards) <= 3
            and not pg_catalog.jsonb_path_exists(showcase_cards, '$[*] ? (@.type() != "object")')
        );
    end if;
end;
$$;

create unique index if not exists profiles_friend_code_unique_idx on public.profiles(upper(friend_code));
create or replace function public.set_profile_friend_code()
returns trigger language plpgsql set search_path = ''
as $$
begin
    if new.friend_code is null or btrim(new.friend_code) = '' then
        new.friend_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
    end if;
    return new;
end;
$$;
drop trigger if exists profiles_set_friend_code on public.profiles;
create trigger profiles_set_friend_code before insert on public.profiles
for each row execute function public.set_profile_friend_code();

create table if not exists public.player_friendships (
    user_low uuid not null references auth.users(id) on delete cascade,
    user_high uuid not null references auth.users(id) on delete cascade,
    requested_by uuid not null references auth.users(id) on delete cascade,
    status text not null default 'pending' check (status in ('pending','accepted')),
    created_at timestamptz not null default clock_timestamp(),
    updated_at timestamptz not null default clock_timestamp(),
    primary key(user_low,user_high),
    check(user_low < user_high),
    check(requested_by=user_low or requested_by=user_high)
);
alter table public.player_friendships enable row level security;
revoke all on table public.player_friendships from public, anon, authenticated;
drop policy if exists player_friendships_no_direct_access on public.player_friendships;
create policy player_friendships_no_direct_access on public.player_friendships for all to anon, authenticated using(false) with check(false);
create index if not exists player_friendships_low_status_idx on public.player_friendships(user_low,status,created_at desc);
create index if not exists player_friendships_high_status_idx on public.player_friendships(user_high,status,created_at desc);

create table if not exists public.mb_player_presence (
    user_id uuid primary key references auth.users(id) on delete cascade,
    last_seen_at timestamptz not null default clock_timestamp()
);
alter table public.mb_player_presence enable row level security;
revoke all on table public.mb_player_presence from public, anon, authenticated;
drop policy if exists mb_player_presence_no_direct_access on public.mb_player_presence;
create policy mb_player_presence_no_direct_access on public.mb_player_presence for all to anon, authenticated using(false) with check(false);
create index if not exists mb_player_presence_last_seen_idx on public.mb_player_presence(last_seen_at desc);

create table if not exists public.player_clan_invites (
    id uuid primary key default gen_random_uuid(),
    clan_id uuid not null references public.clans(id) on delete cascade,
    sender_id uuid not null references public.profiles(id) on delete cascade,
    target_id uuid not null references public.profiles(id) on delete cascade,
    status text not null default 'pending' check(status in ('pending','accepted','declined','cancelled')),
    created_at timestamptz not null default clock_timestamp(),
    expires_at timestamptz not null default (clock_timestamp() + interval '7 days'),
    check(sender_id <> target_id)
);
alter table public.player_clan_invites enable row level security;
revoke all on table public.player_clan_invites from public, anon, authenticated;
drop policy if exists player_clan_invites_no_direct_access on public.player_clan_invites;
create policy player_clan_invites_no_direct_access on public.player_clan_invites for all to anon, authenticated using(false) with check(false);
create unique index if not exists player_clan_invites_one_pending_idx on public.player_clan_invites(clan_id,target_id) where status='pending';
create index if not exists player_clan_invites_target_pending_idx on public.player_clan_invites(target_id,created_at desc) where status='pending';

create or replace function public.mb_touch_presence()
returns timestamptz language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := auth.uid(); v_seen timestamptz;
begin
    if v_uid is null then raise exception 'auth_required'; end if;
    insert into public.mb_player_presence(user_id,last_seen_at) values(v_uid,clock_timestamp())
    on conflict(user_id) do update set last_seen_at=excluded.last_seen_at
    returning last_seen_at into v_seen;
    return v_seen;
end;
$$;

create or replace function public.mb_search_players(p_query text)
returns table(user_id uuid, display_name text, friend_code text, avatar_name text, active_title text, highest_wave integer, is_online boolean)
language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := auth.uid(); v_query text := btrim(coalesce(p_query,'')); v_code text;
begin
    if v_uid is null then raise exception 'auth_required'; end if;
    if char_length(v_query)<2 then raise exception 'friend_search_too_short'; end if;
    v_code := upper(replace(v_query,'MB-',''));
    return query
    select p.id,p.display_name,p.friend_code,p.avatar_name,p.active_title,p.highest_wave,
        coalesce(pr.last_seen_at >= clock_timestamp()-interval '2 minutes',false)
    from public.profiles p left join public.mb_player_presence pr on pr.user_id=p.id
    where p.id<>v_uid and (p.display_name ilike '%'||v_query||'%' or upper(p.friend_code)=v_code)
    order by case when upper(p.friend_code)=v_code then 0 else 1 end,p.highest_wave desc nulls last,p.display_name
    limit 15;
end;
$$;

create or replace function public.mb_get_friends()
returns table(user_id uuid,display_name text,friend_code text,avatar_name text,active_title text,highest_wave integer,is_online boolean,last_seen_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := auth.uid();
begin
    if v_uid is null then raise exception 'auth_required'; end if;
    return query
    select p.id,p.display_name,p.friend_code,p.avatar_name,p.active_title,p.highest_wave,
        coalesce(pr.last_seen_at >= clock_timestamp()-interval '2 minutes',false),pr.last_seen_at
    from public.player_friendships f
    join public.profiles p on p.id=case when f.user_low=v_uid then f.user_high else f.user_low end
    left join public.mb_player_presence pr on pr.user_id=p.id
    where (f.user_low=v_uid or f.user_high=v_uid) and f.status='accepted'
    order by coalesce(pr.last_seen_at >= clock_timestamp()-interval '2 minutes',false) desc,p.display_name;
end;
$$;

create or replace function public.mb_get_friend_requests()
returns table(direction text,user_id uuid,display_name text,friend_code text,avatar_name text,active_title text,highest_wave integer,created_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := auth.uid();
begin
    if v_uid is null then raise exception 'auth_required'; end if;
    return query
    select case when f.requested_by=v_uid then 'outgoing' else 'incoming' end,
        p.id,p.display_name,p.friend_code,p.avatar_name,p.active_title,p.highest_wave,f.created_at
    from public.player_friendships f
    join public.profiles p on p.id=case when f.user_low=v_uid then f.user_high else f.user_low end
    where (f.user_low=v_uid or f.user_high=v_uid) and f.status='pending'
    order by f.created_at desc;
end;
$$;

create or replace function public.mb_send_friend_request(p_target_user_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid:=auth.uid(); v_low uuid; v_high uuid; v_row public.player_friendships%rowtype;
begin
    if v_uid is null then raise exception 'auth_required'; end if;
    if p_target_user_id is null or p_target_user_id=v_uid then raise exception 'friend_target_invalid'; end if;
    if not exists(select 1 from public.profiles p where p.id=p_target_user_id) then raise exception 'profile_not_found'; end if;
    v_low:=least(v_uid,p_target_user_id); v_high:=greatest(v_uid,p_target_user_id);
    insert into public.player_friendships(user_low,user_high,requested_by,status)
    values(v_low,v_high,v_uid,'pending') on conflict(user_low,user_high) do nothing;
    select * into v_row from public.player_friendships where user_low=v_low and user_high=v_high for update;
    if v_row.status='accepted' then return jsonb_build_object('ok',true,'status','already_friends');
    elsif v_row.requested_by=v_uid then return jsonb_build_object('ok',true,'status','already_sent');
    else
        update public.player_friendships set status='accepted',updated_at=clock_timestamp() where user_low=v_low and user_high=v_high;
        return jsonb_build_object('ok',true,'status','accepted');
    end if;
end;
$$;

create or replace function public.mb_respond_friend_request(p_target_user_id uuid,p_action text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid:=auth.uid(); v_low uuid; v_high uuid; v_row public.player_friendships%rowtype;
begin
    if v_uid is null then raise exception 'auth_required'; end if;
    if p_target_user_id is null or p_target_user_id=v_uid then raise exception 'friend_target_invalid'; end if;
    if p_action not in ('accept','reject','cancel','remove') then raise exception 'friend_action_invalid'; end if;
    v_low:=least(v_uid,p_target_user_id); v_high:=greatest(v_uid,p_target_user_id);
    select * into v_row from public.player_friendships where user_low=v_low and user_high=v_high for update;
    if not found then raise exception 'friendship_not_found'; end if;
    if p_action='accept' then
        if v_row.status<>'pending' or v_row.requested_by=v_uid then raise exception 'friend_request_not_incoming'; end if;
        update public.player_friendships set status='accepted',updated_at=clock_timestamp() where user_low=v_low and user_high=v_high;
    elsif p_action='reject' then
        if v_row.status<>'pending' or v_row.requested_by=v_uid then raise exception 'friend_request_not_incoming'; end if;
        delete from public.player_friendships where user_low=v_low and user_high=v_high;
    elsif p_action='cancel' then
        if v_row.status<>'pending' or v_row.requested_by<>v_uid then raise exception 'friend_request_not_outgoing'; end if;
        delete from public.player_friendships where user_low=v_low and user_high=v_high;
    else
        if v_row.status<>'accepted' then raise exception 'friendship_not_found'; end if;
        delete from public.player_friendships where user_low=v_low and user_high=v_high;
    end if;
    return jsonb_build_object('ok',true,'status',p_action);
end;
$$;

create or replace function public.mb_get_clan_invites()
returns table(invite_id uuid,direction text,clan_id uuid,clan_name text,clan_tag text,sender_id uuid,sender_name text,target_id uuid,target_name text,created_at timestamptz,expires_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid:=auth.uid();
begin
    if v_uid is null then raise exception 'auth_required'; end if;
    return query
    select i.id,case when i.target_id=v_uid then 'incoming' else 'outgoing' end,
        c.id,c.name,c.tag,i.sender_id,sp.display_name,i.target_id,tp.display_name,i.created_at,i.expires_at
    from public.player_clan_invites i
    join public.clans c on c.id=i.clan_id
    join public.profiles sp on sp.id=i.sender_id
    join public.profiles tp on tp.id=i.target_id
    where (i.sender_id=v_uid or i.target_id=v_uid) and i.status='pending' and i.expires_at>clock_timestamp()
    order by i.created_at desc limit 50;
end;
$$;

create or replace function public.mb_send_clan_invite(p_target_user_id uuid,p_clan_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid:=auth.uid(); v_role text;
begin
    if v_uid is null then raise exception 'auth_required'; end if;
    if p_target_user_id is null or p_target_user_id=v_uid then raise exception 'clan_invite_target_invalid'; end if;
    select role into v_role from public.clan_members where user_id=v_uid and clan_id=p_clan_id;
    if v_role is null or v_role not in ('leader','officer') then raise exception 'clan_invite_leader_only'; end if;
    if not exists(select 1 from public.player_friendships f where f.user_low=least(v_uid,p_target_user_id) and f.user_high=greatest(v_uid,p_target_user_id) and f.status='accepted') then raise exception 'clan_invite_friends_only'; end if;
    if exists(select 1 from public.clan_members m where m.user_id=p_target_user_id) then raise exception 'clan_invite_target_in_clan'; end if;
    if exists(select 1 from public.player_clan_invites i where i.clan_id=p_clan_id and i.target_id=p_target_user_id and i.status='pending' and i.expires_at>clock_timestamp()) then
        return jsonb_build_object('ok',true,'status','already_sent');
    end if;
    insert into public.player_clan_invites(clan_id,sender_id,target_id) values(p_clan_id,v_uid,p_target_user_id);
    return jsonb_build_object('ok',true,'status','sent');
end;
$$;

create or replace function public.mb_respond_clan_invite(p_invite_id uuid,p_action text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid:=auth.uid(); v_invite public.player_clan_invites%rowtype;
begin
    if v_uid is null then raise exception 'auth_required'; end if;
    if p_action not in ('accept','decline','cancel') then raise exception 'clan_invite_action_invalid'; end if;
    select * into v_invite from public.player_clan_invites
    where id=p_invite_id and status='pending' and expires_at>clock_timestamp() for update;
    if not found then raise exception 'clan_invite_not_found'; end if;
    if p_action in ('accept','decline') then
        if v_invite.target_id<>v_uid then raise exception 'clan_invite_not_recipient'; end if;
    else
        if v_invite.sender_id<>v_uid then raise exception 'clan_invite_not_sender'; end if;
    end if;
    if p_action='accept' then
        if exists(select 1 from public.clan_members m where m.user_id=v_uid) then raise exception 'already_in_clan'; end if;
        insert into public.clan_members(user_id,clan_id,role) values(v_uid,v_invite.clan_id,'member');
        update public.player_clan_invites set status='accepted' where id=p_invite_id;
    elsif p_action='decline' then
        update public.player_clan_invites set status='declined' where id=p_invite_id;
    else
        update public.player_clan_invites set status='cancelled' where id=p_invite_id;
    end if;
    return jsonb_build_object('ok',true,'status',p_action);
end;
$$;

revoke all on function public.mb_touch_presence() from public,anon;
revoke all on function public.mb_search_players(text) from public,anon;
revoke all on function public.mb_get_friends() from public,anon;
revoke all on function public.mb_get_friend_requests() from public,anon;
revoke all on function public.mb_send_friend_request(uuid) from public,anon;
revoke all on function public.mb_respond_friend_request(uuid,text) from public,anon;
revoke all on function public.mb_get_clan_invites() from public,anon;
revoke all on function public.mb_send_clan_invite(uuid,uuid) from public,anon;
revoke all on function public.mb_respond_clan_invite(uuid,text) from public,anon;
grant execute on function public.mb_touch_presence() to authenticated;
grant execute on function public.mb_search_players(text) to authenticated;
grant execute on function public.mb_get_friends() to authenticated;
grant execute on function public.mb_get_friend_requests() to authenticated;
grant execute on function public.mb_send_friend_request(uuid) to authenticated;
grant execute on function public.mb_respond_friend_request(uuid,text) to authenticated;
grant execute on function public.mb_get_clan_invites() to authenticated;
grant execute on function public.mb_send_clan_invite(uuid,uuid) to authenticated;
grant execute on function public.mb_respond_clan_invite(uuid,text) to authenticated;
