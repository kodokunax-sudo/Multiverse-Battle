-- Track active play sessions and stage visits without exposing raw session tables.
create table if not exists public.mb_game_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    started_at timestamptz not null default clock_timestamp(),
    last_heartbeat_at timestamptz not null default clock_timestamp(),
    paused_at timestamptz,
    ended_at timestamptz,
    total_seconds bigint not null default 0 check (total_seconds >= 0 and total_seconds <= 31536000),
    last_stage_key text not null check (char_length(last_stage_key) between 1 and 80),
    last_stage_label text not null check (char_length(last_stage_label) between 1 and 100),
    last_wave integer not null default 1 check (last_wave between 1 and 1000000000),
    rebirth_count integer not null default 0 check (rebirth_count between 0 and 1000000)
);
create index if not exists mb_game_sessions_user_started_idx on public.mb_game_sessions(user_id, started_at desc);
create index if not exists mb_game_sessions_recent_heartbeat_idx on public.mb_game_sessions(last_heartbeat_at desc);
create index if not exists mb_game_sessions_open_user_idx on public.mb_game_sessions(user_id, last_heartbeat_at desc) where ended_at is null;

create table if not exists public.mb_game_stage_visits (
    user_id uuid not null references public.profiles(id) on delete cascade,
    session_id uuid not null references public.mb_game_sessions(id) on delete cascade,
    stage_key text not null check (char_length(stage_key) between 1 and 80),
    stage_label text not null check (char_length(stage_label) between 1 and 100),
    entry_count integer not null default 1 check (entry_count >= 1),
    total_seconds bigint not null default 0 check (total_seconds >= 0),
    first_seen_at timestamptz not null default clock_timestamp(),
    last_seen_at timestamptz not null default clock_timestamp(),
    primary key (user_id, session_id, stage_key)
);
create index if not exists mb_game_stage_visits_stage_idx on public.mb_game_stage_visits(stage_key, total_seconds desc);
create index if not exists mb_game_stage_visits_user_stage_idx on public.mb_game_stage_visits(user_id, total_seconds desc);

alter table public.mb_game_sessions enable row level security;
alter table public.mb_game_stage_visits enable row level security;
revoke all on table public.mb_game_sessions from public, anon, authenticated;
revoke all on table public.mb_game_stage_visits from public, anon, authenticated;
drop policy if exists mb_game_sessions_no_direct_access on public.mb_game_sessions;
create policy mb_game_sessions_no_direct_access on public.mb_game_sessions for all to anon, authenticated using (false) with check (false);
drop policy if exists mb_game_stage_visits_no_direct_access on public.mb_game_stage_visits;
create policy mb_game_stage_visits_no_direct_access on public.mb_game_stage_visits for all to anon, authenticated using (false) with check (false);

create or replace function public.mb_start_game_session(p_stage_key text, p_stage_label text, p_wave integer, p_rebirth integer)
returns uuid
language plpgsql security definer set search_path = ''
as $function$
declare
    v_uid uuid := auth.uid();
    v_now timestamptz := pg_catalog.clock_timestamp();
    v_session_id uuid;
    v_stage_key text := lower(btrim(coalesce(p_stage_key, '')));
    v_stage_label text := left(btrim(coalesce(p_stage_label, '')), 100);
    v_wave integer := greatest(1, least(1000000000, coalesce(p_wave, 1)));
    v_rebirth integer := greatest(0, least(1000000, coalesce(p_rebirth, 0)));
begin
    if v_uid is null then raise exception 'auth_required' using errcode = '28000'; end if;
    if v_stage_key !~ '^[a-z0-9_:-]{1,80}$' or char_length(v_stage_label) = 0 then
        raise exception 'game_stage_invalid' using errcode = '22023';
    end if;
    if not exists (select 1 from public.profiles p where p.id = v_uid) then
        raise exception 'profile_not_found' using errcode = 'P0002';
    end if;

    update public.mb_game_sessions s
       set ended_at = coalesce(s.paused_at, s.last_heartbeat_at, v_now)
     where s.user_id = v_uid and s.ended_at is null;

    insert into public.mb_game_sessions(user_id, started_at, last_heartbeat_at, last_stage_key, last_stage_label, last_wave, rebirth_count)
    values (v_uid, v_now, v_now, v_stage_key, v_stage_label, v_wave, v_rebirth)
    returning id into v_session_id;

    insert into public.mb_game_stage_visits(user_id, session_id, stage_key, stage_label, entry_count, total_seconds, first_seen_at, last_seen_at)
    values (v_uid, v_session_id, v_stage_key, v_stage_label, 1, 0, v_now, v_now);
    return v_session_id;
end;
$function$;

create or replace function public.mb_track_game_session(
    p_session_id uuid, p_stage_key text, p_stage_label text, p_wave integer, p_rebirth integer, p_pause boolean default false
)
returns jsonb
language plpgsql security definer set search_path = ''
as $function$
declare
    v_uid uuid := auth.uid();
    v_now timestamptz := pg_catalog.clock_timestamp();
    v_session public.mb_game_sessions%rowtype;
    v_stage_key text := lower(btrim(coalesce(p_stage_key, '')));
    v_stage_label text := left(btrim(coalesce(p_stage_label, '')), 100);
    v_wave integer := greatest(1, least(1000000000, coalesce(p_wave, 1)));
    v_rebirth integer := greatest(0, least(1000000, coalesce(p_rebirth, 0)));
    v_delta integer;
begin
    if v_uid is null then raise exception 'auth_required' using errcode = '28000'; end if;
    if p_session_id is null or v_stage_key !~ '^[a-z0-9_:-]{1,80}$' or char_length(v_stage_label) = 0 then
        raise exception 'game_session_invalid' using errcode = '22023';
    end if;

    select s.* into v_session from public.mb_game_sessions s
     where s.id = p_session_id and s.user_id = v_uid for update;
    if not found then raise exception 'game_session_not_found' using errcode = 'P0002'; end if;
    if v_session.ended_at is not null then return jsonb_build_object('status', 'closed'); end if;

    if v_session.paused_at is not null then
        if p_pause then return jsonb_build_object('status', 'paused'); end if;
        if v_now - v_session.paused_at > interval '5 minutes' then
            update public.mb_game_sessions set ended_at = v_session.paused_at where id = p_session_id and user_id = v_uid;
            return jsonb_build_object('status', 'expired');
        end if;

        if v_stage_key <> v_session.last_stage_key then
            insert into public.mb_game_stage_visits(user_id, session_id, stage_key, stage_label, entry_count, total_seconds, first_seen_at, last_seen_at)
            values(v_uid, p_session_id, v_stage_key, v_stage_label, 1, 0, v_now, v_now)
            on conflict(user_id, session_id, stage_key) do update
                set stage_label = excluded.stage_label,
                    entry_count = public.mb_game_stage_visits.entry_count + 1,
                    last_seen_at = excluded.last_seen_at;
        else
            update public.mb_game_stage_visits set last_seen_at = v_now, stage_label = v_stage_label
             where user_id = v_uid and session_id = p_session_id and stage_key = v_stage_key;
        end if;

        update public.mb_game_sessions
           set paused_at = null, last_heartbeat_at = v_now, last_stage_key = v_stage_key, last_stage_label = v_stage_label,
               last_wave = greatest(last_wave, v_wave), rebirth_count = v_rebirth
         where id = p_session_id and user_id = v_uid;
        return jsonb_build_object('status', 'resumed');
    end if;

    v_delta := greatest(0, least(90, floor(extract(epoch from (v_now - v_session.last_heartbeat_at)))::integer));

    update public.mb_game_stage_visits
       set total_seconds = total_seconds + v_delta, last_seen_at = v_now
     where user_id = v_uid and session_id = p_session_id and stage_key = v_session.last_stage_key;

    if v_stage_key <> v_session.last_stage_key then
        insert into public.mb_game_stage_visits(user_id, session_id, stage_key, stage_label, entry_count, total_seconds, first_seen_at, last_seen_at)
        values(v_uid, p_session_id, v_stage_key, v_stage_label, 1, 0, v_now, v_now)
        on conflict(user_id, session_id, stage_key) do update
            set stage_label = excluded.stage_label,
                entry_count = public.mb_game_stage_visits.entry_count + 1,
                last_seen_at = excluded.last_seen_at;
    end if;

    update public.mb_game_sessions
       set total_seconds = total_seconds + v_delta, last_heartbeat_at = v_now,
           paused_at = case when p_pause then v_now else null end,
           last_stage_key = v_stage_key, last_stage_label = v_stage_label,
           last_wave = greatest(last_wave, v_wave), rebirth_count = v_rebirth
     where id = p_session_id and user_id = v_uid;

    return jsonb_build_object('status', case when p_pause then 'paused' else 'tracked' end, 'added_seconds', v_delta);
end;
$function$;

create or replace function public.mb_get_game_activity_stats(p_user_id uuid default null)
returns jsonb
language plpgsql security definer set search_path = ''
as $function$
declare
    v_uid uuid := auth.uid();
    v_target uuid := coalesce(p_user_id, auth.uid());
    v_result jsonb;
begin
    if v_uid is null then raise exception 'auth_required' using errcode = '28000'; end if;
    if v_target is null or not exists (select 1 from public.profiles p where p.id = v_target) then
        raise exception 'profile_not_found' using errcode = 'P0002';
    end if;

    select jsonb_build_object(
        'player', (
            select jsonb_build_object(
                'total_sessions', a.total_sessions, 'play_seconds', a.play_seconds,
                'average_session_seconds', a.average_session_seconds, 'sessions_7d', a.sessions_7d,
                'last_session_at', a.last_session_at
            )
            from (
                select count(*)::integer as total_sessions,
                       coalesce(sum(s.total_seconds), 0)::bigint as play_seconds,
                       coalesce(round(avg(s.total_seconds)), 0)::bigint as average_session_seconds,
                       count(*) filter (where s.started_at >= pg_catalog.now() - interval '7 days')::integer as sessions_7d,
                       max(coalesce(s.ended_at, s.last_heartbeat_at, s.started_at)) as last_session_at
                from public.mb_game_sessions s where s.user_id = v_target
            ) a
        ),
        'player_top_stages', (
            select coalesce(jsonb_agg(q.payload order by q.play_seconds desc, q.visits desc), '[]'::jsonb)
            from (
                select jsonb_build_object(
                    'stage_key', v.stage_key, 'stage_label', v.stage_label, 'visits', v.visits,
                    'sessions', v.sessions, 'play_seconds', v.play_seconds, 'last_seen_at', v.last_seen_at
                ) as payload, v.play_seconds, v.visits
                from (
                    select sv.stage_key, max(sv.stage_label) as stage_label,
                           sum(sv.entry_count)::bigint as visits, count(distinct sv.session_id)::integer as sessions,
                           sum(sv.total_seconds)::bigint as play_seconds, max(sv.last_seen_at) as last_seen_at
                    from public.mb_game_stage_visits sv where sv.user_id = v_target
                    group by sv.stage_key order by sum(sv.total_seconds) desc, sum(sv.entry_count) desc limit 5
                ) v
            ) q
        ),
        'server', (
            select jsonb_build_object(
                'total_players', (select count(*)::integer from public.profiles),
                'online_now', (select count(distinct s.user_id)::integer from public.mb_game_sessions s
                    where s.ended_at is null and s.paused_at is null and s.last_heartbeat_at >= pg_catalog.now() - interval '2 minutes'),
                'active_24h', (select count(distinct s.user_id)::integer from public.mb_game_sessions s
                    where s.last_heartbeat_at >= pg_catalog.now() - interval '24 hours'),
                'active_7d', (select count(distinct s.user_id)::integer from public.mb_game_sessions s
                    where s.last_heartbeat_at >= pg_catalog.now() - interval '7 days'),
                'total_sessions', (select count(*)::integer from public.mb_game_sessions),
                'play_seconds', (select coalesce(sum(s.total_seconds), 0)::bigint from public.mb_game_sessions s)
            )
        ),
        'server_top_stages', (
            select coalesce(jsonb_agg(q.payload order by q.visits desc, q.play_seconds desc), '[]'::jsonb)
            from (
                select jsonb_build_object(
                    'stage_key', v.stage_key, 'stage_label', v.stage_label, 'players', v.players,
                    'visits', v.visits, 'sessions', v.sessions, 'play_seconds', v.play_seconds
                ) as payload, v.visits, v.play_seconds
                from (
                    select sv.stage_key, max(sv.stage_label) as stage_label,
                           count(distinct sv.user_id)::integer as players, sum(sv.entry_count)::bigint as visits,
                           count(distinct sv.session_id)::integer as sessions, sum(sv.total_seconds)::bigint as play_seconds
                    from public.mb_game_stage_visits sv group by sv.stage_key
                    order by sum(sv.entry_count) desc, sum(sv.total_seconds) desc limit 5
                ) v
            ) q
        )
    ) into v_result;
    return v_result;
end;
$function$;

revoke all on function public.mb_start_game_session(text, text, integer, integer) from public, anon;
revoke all on function public.mb_track_game_session(uuid, text, text, integer, integer, boolean) from public, anon;
revoke all on function public.mb_get_game_activity_stats(uuid) from public, anon;
grant execute on function public.mb_start_game_session(text, text, integer, integer) to authenticated;
grant execute on function public.mb_track_game_session(uuid, text, text, integer, integer, boolean) to authenticated;
grant execute on function public.mb_get_game_activity_stats(uuid) to authenticated;
