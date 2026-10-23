-- Analytics for the five unique boss encounters only.
create table if not exists public.mb_unique_boss_attempts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    boss_key text not null check (boss_key in ('living_stone','waystar','roger_whitebeard','anti_spiral','living_stone_super')),
    boss_wave integer not null check (boss_wave in (200,500,1000,1500,2000)),
    rebirth_count integer not null default 0 check (rebirth_count >= 0 and rebirth_count <= 1000000),
    started_at timestamptz not null default clock_timestamp(),
    finished_at timestamptz,
    outcome text check (outcome is null or outcome in ('win','death','abandoned')),
    duration_seconds integer not null default 0 check (duration_seconds >= 0 and duration_seconds <= 21600),
    constraint mb_unique_boss_attempt_outcome_consistent check (
        (finished_at is null and outcome is null) or (finished_at is not null and outcome is not null)
    )
);
create index if not exists mb_unique_boss_attempts_user_started_idx on public.mb_unique_boss_attempts(user_id, started_at desc);
create index if not exists mb_unique_boss_attempts_boss_outcome_idx on public.mb_unique_boss_attempts(boss_key, outcome, started_at desc);
create unique index if not exists mb_unique_boss_one_open_attempt_per_user_idx on public.mb_unique_boss_attempts(user_id) where finished_at is null;

alter table public.mb_unique_boss_attempts enable row level security;
revoke all on table public.mb_unique_boss_attempts from public, anon, authenticated;
drop policy if exists mb_unique_boss_attempts_no_direct_access on public.mb_unique_boss_attempts;
create policy mb_unique_boss_attempts_no_direct_access on public.mb_unique_boss_attempts for all to anon, authenticated using (false) with check (false);

CREATE OR REPLACE FUNCTION public.mb_start_unique_boss_attempt(p_boss_key text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
    v_uid uuid := auth.uid();
    v_now timestamptz := clock_timestamp();
    v_boss_key text := lower(btrim(coalesce(p_boss_key,'')));
    v_boss_wave integer;
    v_rebirth integer;
    v_attempt_id uuid;
begin
    if v_uid is null then raise exception 'auth_required' using errcode = '28000'; end if;
    v_boss_wave := case v_boss_key
        when 'living_stone' then 200 when 'waystar' then 500
        when 'roger_whitebeard' then 1000 when 'anti_spiral' then 1500
        when 'living_stone_super' then 2000 else null end;
    if v_boss_wave is null then raise exception 'unique_boss_invalid' using errcode = '22023'; end if;

    select p.rebirth_count into v_rebirth from public.profiles p where p.id = v_uid for update;
    if not found then raise exception 'profile_not_found' using errcode = 'P0002'; end if;

    update public.mb_unique_boss_attempts a
       set finished_at = v_now, outcome = 'abandoned',
           duration_seconds = least(21600, greatest(0, floor(extract(epoch from (v_now - a.started_at)))::integer))
     where a.user_id = v_uid and a.finished_at is null;

    insert into public.mb_unique_boss_attempts(user_id,boss_key,boss_wave,rebirth_count,started_at)
    values(v_uid,v_boss_key,v_boss_wave,greatest(0,least(1000000,coalesce(v_rebirth,0))),v_now)
    returning id into v_attempt_id;
    return v_attempt_id;
end;
$function$

CREATE OR REPLACE FUNCTION public.mb_finish_unique_boss_attempt(p_attempt_id uuid, p_outcome text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
    v_uid uuid := auth.uid();
    v_now timestamptz := clock_timestamp();
    v_attempt public.mb_unique_boss_attempts%rowtype;
    v_outcome text := lower(btrim(coalesce(p_outcome,'')));
begin
    if v_uid is null then raise exception 'auth_required' using errcode = '28000'; end if;
    if p_attempt_id is null or v_outcome not in ('win','death','abandoned') then
        raise exception 'unique_boss_result_invalid' using errcode = '22023';
    end if;
    select a.* into v_attempt from public.mb_unique_boss_attempts a
     where a.id = p_attempt_id and a.user_id = v_uid for update;
    if not found then raise exception 'unique_boss_attempt_not_found' using errcode = 'P0002'; end if;
    if v_attempt.finished_at is not null then
        return jsonb_build_object('status','already_finished','outcome',v_attempt.outcome);
    end if;
    update public.mb_unique_boss_attempts
       set finished_at = v_now, outcome = v_outcome,
           duration_seconds = least(21600, greatest(0, floor(extract(epoch from (v_now - started_at)))::integer))
     where id = p_attempt_id and user_id = v_uid;
    return jsonb_build_object('status','finished','outcome',v_outcome);
end;
$function$

CREATE OR REPLACE FUNCTION public.mb_get_unique_boss_fight_stats(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
    v_uid uuid := auth.uid();
    v_target uuid := coalesce(p_user_id,auth.uid());
    v_result jsonb;
begin
    if v_uid is null then raise exception 'auth_required' using errcode = '28000'; end if;
    if v_target is null or not exists(select 1 from public.profiles p where p.id=v_target) then
        raise exception 'profile_not_found' using errcode = 'P0002';
    end if;

    with boss_catalog(boss_key,boss_wave) as (
        values ('living_stone'::text,200),('waystar'::text,500),('roger_whitebeard'::text,1000),
               ('anti_spiral'::text,1500),('living_stone_super'::text,2000)
    ),
    player_boss as (
        select c.boss_key,c.boss_wave,
            count(a.id)::integer as attempts,
            (count(a.id) filter(where a.outcome='win'))::integer as wins,
            (count(a.id) filter(where a.outcome='death'))::integer as deaths,
            (count(a.id) filter(where a.outcome='abandoned'))::integer as abandoned,
            (count(a.id) filter(where a.finished_at is null))::integer as in_progress,
            coalesce(sum(a.duration_seconds) filter(where a.outcome in ('win','death')),0)::bigint as total_battle_seconds,
            coalesce(round(avg(a.duration_seconds) filter(where a.outcome in ('win','death'))),0)::integer as average_battle_seconds,
            max(a.finished_at) as last_battle_at
        from boss_catalog c left join public.mb_unique_boss_attempts a on a.boss_key=c.boss_key and a.user_id=v_target
        group by c.boss_key,c.boss_wave
    ),
    server_boss as (
        select c.boss_key,c.boss_wave,
            count(a.id)::integer as attempts,
            (count(a.id) filter(where a.outcome='win'))::integer as wins,
            (count(a.id) filter(where a.outcome='death'))::integer as deaths,
            (count(a.id) filter(where a.outcome='abandoned'))::integer as abandoned,
            (count(a.id) filter(where a.finished_at is null))::integer as in_progress,
            (count(distinct a.user_id) filter(where a.id is not null))::integer as players,
            coalesce(sum(a.duration_seconds) filter(where a.outcome in ('win','death')),0)::bigint as total_battle_seconds,
            coalesce(round(avg(a.duration_seconds) filter(where a.outcome in ('win','death'))),0)::integer as average_battle_seconds,
            max(a.finished_at) as last_battle_at
        from boss_catalog c left join public.mb_unique_boss_attempts a on a.boss_key=c.boss_key
        group by c.boss_key,c.boss_wave
    )
    select jsonb_build_object(
        'player_summary', (
            select jsonb_build_object(
                'attempts',count(*)::integer,'wins',(count(*) filter(where a.outcome='win'))::integer,
                'deaths',(count(*) filter(where a.outcome='death'))::integer,
                'abandoned',(count(*) filter(where a.outcome='abandoned'))::integer,
                'in_progress',(count(*) filter(where a.finished_at is null))::integer,
                'completed',(count(*) filter(where a.outcome in ('win','death')))::integer,
                'win_rate',coalesce(round(100.0*(count(*) filter(where a.outcome='win'))/
                    nullif((count(*) filter(where a.outcome in ('win','death'))),0),1),0),
                'total_battle_seconds',coalesce(sum(a.duration_seconds) filter(where a.outcome in ('win','death')),0)::bigint,
                'average_battle_seconds',coalesce(round(avg(a.duration_seconds) filter(where a.outcome in ('win','death'))),0)::integer,
                'last_battle_at',max(a.finished_at)
            ) from public.mb_unique_boss_attempts a where a.user_id=v_target
        ),
        'player_by_boss', (
            select coalesce(jsonb_agg(jsonb_build_object(
                'boss_key',p.boss_key,'boss_wave',p.boss_wave,'attempts',p.attempts,'wins',p.wins,'deaths',p.deaths,
                'abandoned',p.abandoned,'in_progress',p.in_progress,'completed',p.wins+p.deaths,
                'win_rate',coalesce(round(100.0*p.wins/nullif(p.wins+p.deaths,0),1),0),
                'total_battle_seconds',p.total_battle_seconds,'average_battle_seconds',p.average_battle_seconds,
                'last_battle_at',p.last_battle_at
            ) order by p.attempts desc,p.boss_wave asc),'[]'::jsonb) from player_boss p
        ),
        'server_summary', (
            select jsonb_build_object(
                'players',count(distinct a.user_id)::integer,'attempts',count(*)::integer,
                'wins',(count(*) filter(where a.outcome='win'))::integer,
                'deaths',(count(*) filter(where a.outcome='death'))::integer,
                'abandoned',(count(*) filter(where a.outcome='abandoned'))::integer,
                'in_progress',(count(*) filter(where a.finished_at is null))::integer,
                'completed',(count(*) filter(where a.outcome in ('win','death')))::integer,
                'win_rate',coalesce(round(100.0*(count(*) filter(where a.outcome='win'))/
                    nullif((count(*) filter(where a.outcome in ('win','death'))),0),1),0),
                'total_battle_seconds',coalesce(sum(a.duration_seconds) filter(where a.outcome in ('win','death')),0)::bigint
            ) from public.mb_unique_boss_attempts a
        ),
        'server_by_boss', (
            select coalesce(jsonb_agg(jsonb_build_object(
                'boss_key',b.boss_key,'boss_wave',b.boss_wave,'players',b.players,'attempts',b.attempts,
                'wins',b.wins,'deaths',b.deaths,'abandoned',b.abandoned,'in_progress',b.in_progress,
                'completed',b.wins+b.deaths,'win_rate',coalesce(round(100.0*b.wins/nullif(b.wins+b.deaths,0),1),0),
                'total_battle_seconds',b.total_battle_seconds,'average_battle_seconds',b.average_battle_seconds,
                'last_battle_at',b.last_battle_at
            ) order by b.attempts desc,b.boss_wave asc),'[]'::jsonb) from server_boss b
        ),
        'recent_results', (
            select coalesce(jsonb_agg(q.payload order by q.started_at desc),'[]'::jsonb)
            from (
                select jsonb_build_object(
                    'boss_key',a.boss_key,'boss_wave',a.boss_wave,'rebirth_count',a.rebirth_count,
                    'outcome',coalesce(a.outcome,'in_progress'),'duration_seconds',a.duration_seconds,
                    'started_at',a.started_at,'finished_at',a.finished_at
                ) as payload,a.started_at
                from public.mb_unique_boss_attempts a where a.user_id=v_target
                order by a.started_at desc limit 10
            ) q
        )
    ) into v_result;
    return v_result;
end;
$function$


revoke all on function public.mb_start_unique_boss_attempt(text) from public,anon;
revoke all on function public.mb_finish_unique_boss_attempt(uuid,text) from public,anon;
revoke all on function public.mb_get_unique_boss_fight_stats(uuid) from public,anon;
grant execute on function public.mb_start_unique_boss_attempt(text) to authenticated;
grant execute on function public.mb_finish_unique_boss_attempt(uuid,text) to authenticated;
grant execute on function public.mb_get_unique_boss_fight_stats(uuid) to authenticated;
