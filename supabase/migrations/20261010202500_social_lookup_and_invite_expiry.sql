-- Normalize friend-code searches and free up expired pending clan invites before resending.
create or replace function public.mb_search_players(p_query text)
returns table(user_id uuid, display_name text, friend_code text, avatar_name text, active_title text, highest_wave integer, is_online boolean)
language plpgsql security definer set search_path = ''
as $$
declare
    v_uid uuid := auth.uid();
    v_query text := btrim(coalesce(p_query,''));
    v_code text;
begin
    if v_uid is null then raise exception 'auth_required'; end if;
    if char_length(v_query) < 2 then raise exception 'friend_search_too_short'; end if;
    v_code := replace(upper(v_query), 'MB-', '');
    return query
    select p.id,p.display_name,p.friend_code,p.avatar_name,p.active_title,p.highest_wave,
        coalesce(pr.last_seen_at >= clock_timestamp()-interval '2 minutes',false)
    from public.profiles p
    left join public.mb_player_presence pr on pr.user_id=p.id
    where p.id<>v_uid and (p.display_name ilike '%'||v_query||'%' or upper(p.friend_code)=v_code)
    order by case when upper(p.friend_code)=v_code then 0 else 1 end,p.highest_wave desc nulls last,p.display_name
    limit 15;
end;
$$;
revoke all on function public.mb_search_players(text) from public,anon;
grant execute on function public.mb_search_players(text) to authenticated;

create or replace function public.mb_send_clan_invite(p_target_user_id uuid,p_clan_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid:=auth.uid(); v_role text;
begin
    if v_uid is null then raise exception 'auth_required'; end if;
    if p_target_user_id is null or p_target_user_id=v_uid then raise exception 'clan_invite_target_invalid'; end if;
    select role into v_role from public.clan_members where user_id=v_uid and clan_id=p_clan_id;
    if v_role is null or v_role not in ('leader','officer') then raise exception 'clan_invite_leader_only'; end if;
    if not exists(
        select 1 from public.player_friendships f
        where f.user_low=least(v_uid,p_target_user_id)
          and f.user_high=greatest(v_uid,p_target_user_id)
          and f.status='accepted'
    ) then raise exception 'clan_invite_friends_only'; end if;
    if exists(select 1 from public.clan_members m where m.user_id=p_target_user_id) then
        raise exception 'clan_invite_target_in_clan';
    end if;

    update public.player_clan_invites
       set status='cancelled'
     where clan_id=p_clan_id and target_id=p_target_user_id
       and status='pending' and expires_at<=clock_timestamp();

    if exists(
        select 1 from public.player_clan_invites i
        where i.clan_id=p_clan_id and i.target_id=p_target_user_id
          and i.status='pending' and i.expires_at>clock_timestamp()
    ) then
        return jsonb_build_object('ok',true,'status','already_sent');
    end if;
    insert into public.player_clan_invites(clan_id,sender_id,target_id)
    values(p_clan_id,v_uid,p_target_user_id);
    return jsonb_build_object('ok',true,'status','sent');
end;
$$;
revoke all on function public.mb_send_clan_invite(uuid,uuid) from public,anon;
grant execute on function public.mb_send_clan_invite(uuid,uuid) to authenticated;
