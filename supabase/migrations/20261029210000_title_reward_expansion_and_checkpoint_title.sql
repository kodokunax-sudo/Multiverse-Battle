-- One-time multi-currency rewards for achievement titles.
-- Current wave/checkpoint columns support the return-to-wave-1 title.

alter table public.profiles
    add column if not exists current_wave integer not null default 1
        check (current_wave between 1 and 1000000000),
    add column if not exists highest_checkpoint integer not null default 1
        check (highest_checkpoint between 1 and 1000000000),
    add column if not exists achievement_title_unlocks text[] not null default '{}'::text[];

grant update (current_wave, highest_checkpoint, achievement_title_unlocks)
    on table public.profiles to authenticated;

alter table public.mb_title_reward_claims
    add column if not exists reward_power_points bigint not null default 0
        check (reward_power_points between 0 and 1000000000),
    add column if not exists reward_free_spins integer not null default 0
        check (reward_free_spins between 0 and 1000),
    add column if not exists reward_legendary_spins integer not null default 0
        check (reward_legendary_spins between 0 and 1000),
    add column if not exists reward_secret_spins integer not null default 0
        check (reward_secret_spins between 0 and 1000);

alter table public.mb_title_reward_claims
    drop constraint if exists mb_title_reward_claims_title_id_check,
    drop constraint if exists mb_title_reward_claims_reward_points_check;

alter table public.mb_title_reward_claims
    add constraint mb_title_reward_claims_reward_points_check
        check (reward_points between 1 and 1000000000);

create table if not exists public.mb_achievement_title_reward_catalog (
    title_id text primary key,
    reward_stars integer not null check (reward_stars between 1 and 1000000000),
    reward_power_points bigint not null default 0 check (reward_power_points between 0 and 1000000000),
    reward_free_spins integer not null default 0 check (reward_free_spins between 0 and 1000),
    reward_legendary_spins integer not null default 0 check (reward_legendary_spins between 0 and 1000),
    reward_secret_spins integer not null default 0 check (reward_secret_spins between 0 and 1000),
    stat_key text not null,
    stat_min bigint not null check (stat_min >= 0),
    second_stat_key text,
    second_stat_min bigint,
    second_stat_mode text not null default 'gte' check (second_stat_mode in ('gte','eq')),
    allow_owned_unlock boolean not null default false
);

alter table public.mb_achievement_title_reward_catalog enable row level security;
revoke all on table public.mb_achievement_title_reward_catalog from public, anon, authenticated;

insert into public.mb_achievement_title_reward_catalog(
    title_id, reward_stars, reward_power_points, reward_free_spins,
    reward_legendary_spins, reward_secret_spins, stat_key, stat_min,
    second_stat_key, second_stat_min, second_stat_mode, allow_owned_unlock
)
values
('wave_100', 100000, 500, 0, 0, 0, 'highest_wave', 250, null, null, 'gte', false),
('boss_hunter', 750000, 10000, 10, 1, 0, 'bosses_defeated', 100, null, null, 'gte', false),
('collector', 1000000, 25000, 15, 0, 0, 'cards_collected', 400, null, null, 'gte', false),
('champion', 1500000, 30000, 10, 3, 0, 'total_wins', 1000, null, null, 'gte', false),
('reborn', 1000000, 20000, 10, 0, 0, 'rebirth_count', 15, null, null, 'gte', false),
('multiverse_legend', 10000000, 100000, 25, 10, 2, 'highest_wave', 1500, 'bosses_defeated', 50, 'gte', false),
('wave_200', 300000, 1000, 0, 0, 0, 'highest_wave', 400, null, null, 'gte', false),
('wave_300', 500000, 2500, 5, 0, 0, 'highest_wave', 600, null, null, 'gte', false),
('wave_500', 1000000, 5000, 0, 1, 0, 'highest_wave', 900, null, null, 'gte', false),
('wave_750', 1500000, 10000, 10, 0, 0, 'highest_wave', 1200, null, null, 'gte', false),
('wave_1500', 5000000, 50000, 0, 5, 0, 'highest_wave', 2500, null, null, 'gte', false),
('wave_2000', 7500000, 75000, 20, 5, 0, 'highest_wave', 3000, null, null, 'gte', false),
('wave_5000', 25000000, 250000, 0, 10, 2, 'highest_wave', 7500, null, null, 'gte', false),
('wave_10000', 100000000, 1000000, 50, 20, 5, 'highest_wave', 15000, null, null, 'gte', false),
('bosses_1', 100000, 500, 0, 0, 0, 'bosses_defeated', 3, null, null, 'gte', false),
('bosses_5', 250000, 1000, 3, 0, 0, 'bosses_defeated', 15, null, null, 'gte', false),
('bosses_25', 500000, 5000, 5, 1, 0, 'bosses_defeated', 60, null, null, 'gte', false),
('bosses_50', 1000000, 10000, 0, 2, 0, 'bosses_defeated', 125, null, null, 'gte', false),
('bosses_100', 2500000, 25000, 0, 3, 0, 'bosses_defeated', 250, null, null, 'gte', false),
('bosses_250', 10000000, 100000, 0, 10, 2, 'bosses_defeated', 1000, null, null, 'gte', false),
('bosses_500', 100000000, 1000000, 0, 20, 10, 'bosses_defeated', 5000, null, null, 'gte', false),
('wins_1', 100000, 500, 0, 0, 0, 'total_wins', 5, null, null, 'gte', false),
('wins_50', 500000, 5000, 5, 0, 0, 'total_wins', 100, null, null, 'gte', false),
('wins_100', 1500000, 15000, 0, 2, 0, 'total_wins', 250, null, null, 'gte', false),
('wins_250', 3000000, 30000, 10, 3, 0, 'total_wins', 500, null, null, 'gte', false),
('wins_500', 15000000, 150000, 0, 10, 0, 'total_wins', 1200, null, null, 'gte', false),
('wins_1000', 50000000, 500000, 0, 15, 5, 'total_wins', 2500, null, null, 'gte', false),
('cards_100', 250000, 2000, 5, 0, 0, 'cards_collected', 150, null, null, 'gte', false),
('cards_250', 500000, 5000, 5, 0, 0, 'cards_collected', 400, null, null, 'gte', false),
('cards_500', 2500000, 25000, 10, 2, 0, 'cards_collected', 900, null, null, 'gte', false),
('cards_1000', 25000000, 250000, 25, 10, 2, 'cards_collected', 2000, null, null, 'gte', false),
('rebirth_1', 500000, 5000, 0, 0, 0, 'rebirth_count', 3, null, null, 'gte', false),
('rebirth_10', 1500000, 15000, 10, 0, 0, 'rebirth_count', 20, null, null, 'gte', false),
('rebirth_25', 5000000, 50000, 0, 2, 0, 'rebirth_count', 50, null, null, 'gte', false),
('rebirth_50', 15000000, 150000, 20, 5, 0, 'rebirth_count', 100, null, null, 'gte', false),
('rebirth_100', 50000000, 500000, 0, 20, 5, 'rebirth_count', 200, null, null, 'gte', false),
('clicks_1000', 100000, 500, 0, 0, 0, 'total_clicks', 5000, null, null, 'gte', false),
('clicks_10000', 500000, 2000, 5, 0, 0, 'total_clicks', 25000, null, null, 'gte', false),
('clicks_50000', 1500000, 5000, 10, 0, 0, 'total_clicks', 100000, null, null, 'gte', false),
('clicks_100000', 5000000, 25000, 0, 5, 0, 'total_clicks', 250000, null, null, 'gte', false),
('clicks_1000000', 50000000, 250000, 0, 10, 3, 'total_clicks', 2500000, null, null, 'gte', false),
('multiverse_parasite', 10000000, 100000, 20, 10, 2, 'highest_wave', 1500, null, null, 'gte', false),
('overqualified', 15000000, 150000, 15, 5, 1, 'total_wins', 1000, 'cards_collected', 500, 'gte', false),
('rebirth_loop', 50000000, 500000, 20, 10, 5, 'highest_checkpoint', 2000, 'current_wave', 1, 'eq', true),
('card_singularity', 50000000, 500000, 25, 10, 5, 'cards_collected', 2000, 'total_clicks', 250000, 'gte', false),
('final_chairman', 250000000, 2500000, 50, 25, 10, 'highest_wave', 15000, 'bosses_defeated', 1200, 'gte', false)
on conflict (title_id) do update set
    reward_stars = excluded.reward_stars,
    reward_power_points = excluded.reward_power_points,
    reward_free_spins = excluded.reward_free_spins,
    reward_legendary_spins = excluded.reward_legendary_spins,
    reward_secret_spins = excluded.reward_secret_spins,
    stat_key = excluded.stat_key,
    stat_min = excluded.stat_min,
    second_stat_key = excluded.second_stat_key,
    second_stat_min = excluded.second_stat_min,
    second_stat_mode = excluded.second_stat_mode,
    allow_owned_unlock = excluded.allow_owned_unlock;

create or replace function public.mb_claim_achievement_title_reward(p_title_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
    v_uid uuid := auth.uid();
    v_profile public.profiles%rowtype;
    v_catalog public.mb_achievement_title_reward_catalog%rowtype;
    v_unlocked boolean := false;
    v_first_stat bigint := 0;
    v_second_stat bigint := 0;
    v_existing_reward integer;
    v_existing_power bigint;
    v_existing_free integer;
    v_existing_legendary integer;
    v_existing_secret integer;
    v_existing_granted_at timestamptz;
begin
    if v_uid is null then
        raise exception 'auth_required' using errcode = '28000';
    end if;
    if p_title_id is null or pg_catalog.char_length(p_title_id) > 80 then
        return jsonb_build_object('ok', false, 'code', 'title_invalid');
    end if;

    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text, 0));

    select r.reward_points, r.reward_power_points, r.reward_free_spins,
           r.reward_legendary_spins, r.reward_secret_spins, r.granted_at
      into v_existing_reward, v_existing_power, v_existing_free,
           v_existing_legendary, v_existing_secret, v_existing_granted_at
      from public.mb_title_reward_claims r
     where r.user_id = v_uid and r.title_id = p_title_id
     for update;

    if found then
        if v_existing_granted_at is not null then
            return jsonb_build_object('ok', true, 'pending', false, 'already_claimed', true, 'reward_points', 0);
        end if;
        return jsonb_build_object(
            'ok', true, 'pending', true, 'already_claimed', false,
            'reward_points', v_existing_reward,
            'reward', jsonb_build_object(
                'stars', v_existing_reward, 'powerPoints', v_existing_power,
                'freeSpins', v_existing_free, 'legendarySpins', v_existing_legendary,
                'secretSpins', v_existing_secret
            )
        );
    end if;

    select * into v_profile from public.profiles where id = v_uid;
    if not found then
        raise exception 'profile_not_found' using errcode = 'P0002';
    end if;

    select * into v_catalog
      from public.mb_achievement_title_reward_catalog
     where title_id = p_title_id;
    if not found then
        return jsonb_build_object('ok', false, 'code', 'title_has_no_reward');
    end if;

    v_first_stat := coalesce(nullif(pg_catalog.to_jsonb(v_profile)->>v_catalog.stat_key, '')::bigint, 0);
    v_unlocked := v_first_stat >= v_catalog.stat_min;

    if v_catalog.second_stat_key is not null then
        v_second_stat := coalesce(nullif(pg_catalog.to_jsonb(v_profile)->>v_catalog.second_stat_key, '')::bigint, 0);
        if v_catalog.second_stat_mode = 'eq' then
            v_unlocked := v_unlocked and v_second_stat = v_catalog.second_stat_min;
        else
            v_unlocked := v_unlocked and v_second_stat >= v_catalog.second_stat_min;
        end if;
    end if;

    if v_catalog.allow_owned_unlock
       and p_title_id = any(coalesce(v_profile.achievement_title_unlocks, '{}'::text[])) then
        v_unlocked := true;
    end if;

    if not v_unlocked then
        return jsonb_build_object('ok', false, 'code', 'title_locked');
    end if;

    insert into public.mb_title_reward_claims(
        user_id, title_id, reward_points, reward_power_points,
        reward_free_spins, reward_legendary_spins, reward_secret_spins
    )
    values (
        v_uid, p_title_id, v_catalog.reward_stars, v_catalog.reward_power_points,
        v_catalog.reward_free_spins, v_catalog.reward_legendary_spins, v_catalog.reward_secret_spins
    );

    return jsonb_build_object(
        'ok', true, 'pending', true, 'already_claimed', false,
        'reward_points', v_catalog.reward_stars,
        'reward_power_points', v_catalog.reward_power_points,
        'reward_free_spins', v_catalog.reward_free_spins,
        'reward_legendary_spins', v_catalog.reward_legendary_spins,
        'reward_secret_spins', v_catalog.reward_secret_spins,
        'reward', jsonb_build_object(
            'stars', v_catalog.reward_stars, 'powerPoints', v_catalog.reward_power_points,
            'freeSpins', v_catalog.reward_free_spins, 'legendarySpins', v_catalog.reward_legendary_spins,
            'secretSpins', v_catalog.reward_secret_spins
        )
    );
end;
$function$;

revoke all on function public.mb_claim_achievement_title_reward(text) from public, anon;
grant execute on function public.mb_claim_achievement_title_reward(text) to authenticated;
