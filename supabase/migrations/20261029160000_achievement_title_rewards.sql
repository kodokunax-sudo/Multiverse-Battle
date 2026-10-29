-- One-time game currency rewards for selected achievement titles.
create table if not exists public.mb_title_reward_claims (
    user_id uuid not null references auth.users(id) on delete cascade,
    title_id text not null check (title_id = any (array[
        'wave_500','bosses_100','wins_250','cards_500','rebirth_25','clicks_100000',
        'multiverse_legend','multiverse_parasite','overqualified','rebirth_loop',
        'card_singularity','final_chairman'
    ]::text[])),
    reward_points integer not null check (reward_points > 0 and reward_points <= 5000),
    claimed_at timestamptz not null default pg_catalog.clock_timestamp(),
    granted_at timestamptz,
    primary key (user_id, title_id)
);

alter table public.mb_title_reward_claims enable row level security;
revoke all on table public.mb_title_reward_claims from public, anon, authenticated;
grant select on table public.mb_title_reward_claims to authenticated;
drop policy if exists mb_title_reward_claims_select_own on public.mb_title_reward_claims;
create policy mb_title_reward_claims_select_own
    on public.mb_title_reward_claims
    for select to authenticated
    using ((select auth.uid()) = user_id);

create or replace function public.mb_claim_achievement_title_reward(p_title_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
    v_uid uuid := auth.uid();
    v_profile public.profiles%rowtype;
    v_reward integer;
    v_unlocked boolean := false;
    v_existing_reward integer;
    v_existing_granted_at timestamptz;
begin
    if v_uid is null then
        raise exception 'auth_required' using errcode = '28000';
    end if;
    if p_title_id is null or pg_catalog.char_length(p_title_id) > 80 then
        return jsonb_build_object('ok', false, 'code', 'title_invalid');
    end if;

    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text, 0));

    -- Let a pending reward be resumed after a reload without paying it twice.
    select r.reward_points, r.granted_at
      into v_existing_reward, v_existing_granted_at
      from public.mb_title_reward_claims r
     where r.user_id = v_uid and r.title_id = p_title_id
     for update;

    if found then
        if v_existing_granted_at is not null then
            return jsonb_build_object('ok', true, 'pending', false, 'already_claimed', true, 'reward_points', 0);
        end if;
        return jsonb_build_object('ok', true, 'pending', true, 'already_claimed', false, 'reward_points', v_existing_reward);
    end if;

    select * into v_profile from public.profiles where id = v_uid;
    if not found then
        raise exception 'profile_not_found' using errcode = 'P0002';
    end if;

    case p_title_id
        when 'wave_500' then
            v_reward := 200;
            v_unlocked := v_profile.highest_wave >= 900;
        when 'bosses_100' then
            v_reward := 350;
            v_unlocked := v_profile.bosses_defeated >= 250;
        when 'wins_250' then
            v_reward := 400;
            v_unlocked := v_profile.total_wins >= 500;
        when 'cards_500' then
            v_reward := 500;
            v_unlocked := v_profile.cards_collected >= 900;
        when 'rebirth_25' then
            v_reward := 750;
            v_unlocked := v_profile.rebirth_count >= 50;
        when 'clicks_100000' then
            v_reward := 300;
            v_unlocked := v_profile.total_clicks >= 250000;
        when 'multiverse_legend' then
            v_reward := 1000;
            v_unlocked := v_profile.highest_wave >= 1500 and v_profile.bosses_defeated >= 50;
        when 'multiverse_parasite' then
            v_reward := 2000;
            v_unlocked := v_profile.highest_wave >= 3000 and v_profile.bosses_defeated >= 150;
        when 'overqualified' then
            v_reward := 1000;
            v_unlocked := v_profile.total_wins >= 1000 and v_profile.cards_collected >= 500;
        when 'rebirth_loop' then
            v_reward := 1200;
            v_unlocked := v_profile.rebirth_count >= 50 and v_profile.total_wins >= 250;
        when 'card_singularity' then
            v_reward := 1500;
            v_unlocked := v_profile.cards_collected >= 2000 and v_profile.total_clicks >= 250000;
        when 'final_chairman' then
            v_reward := 5000;
            v_unlocked := v_profile.highest_wave >= 15000 and v_profile.bosses_defeated >= 1200;
        else
            return jsonb_build_object('ok', false, 'code', 'title_has_no_reward');
    end case;

    if not v_unlocked then
        return jsonb_build_object('ok', false, 'code', 'title_locked');
    end if;

    insert into public.mb_title_reward_claims(user_id, title_id, reward_points)
    values (v_uid, p_title_id, v_reward);

    return jsonb_build_object('ok', true, 'pending', true, 'already_claimed', false, 'reward_points', v_reward);
end;
$function$;

create or replace function public.mb_complete_achievement_title_reward(p_title_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
    v_uid uuid := auth.uid();
    v_granted_at timestamptz;
begin
    if v_uid is null then
        raise exception 'auth_required' using errcode = '28000';
    end if;

    update public.mb_title_reward_claims
       set granted_at = coalesce(granted_at, pg_catalog.clock_timestamp())
     where user_id = v_uid
       and title_id = p_title_id
     returning granted_at into v_granted_at;

    if not found then
        return jsonb_build_object('ok', false, 'code', 'title_reward_not_claimed');
    end if;

    return jsonb_build_object('ok', true, 'granted_at', v_granted_at);
end;
$function$;

revoke all on function public.mb_claim_achievement_title_reward(text) from public, anon;
revoke all on function public.mb_complete_achievement_title_reward(text) from public, anon;
grant execute on function public.mb_claim_achievement_title_reward(text) to authenticated;
grant execute on function public.mb_complete_achievement_title_reward(text) to authenticated;
