-- Extend the public activity summary with the most-played player leaderboard.
create or replace function public.mb_get_game_activity_stats(p_user_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
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
        'server_top_players', (
            select coalesce(jsonb_agg(q.payload order by q.play_seconds desc, q.total_sessions desc), '[]'::jsonb)
            from (
                select jsonb_build_object(
                    'display_name', a.display_name,
                    'rebirth', a.rebirth_count,
                    'highest_wave', a.highest_wave,
                    'total_sessions', a.total_sessions,
                    'play_seconds', a.play_seconds,
                    'last_session_at', a.last_session_at
                ) as payload, a.play_seconds, a.total_sessions
                from (
                    select p.display_name, p.rebirth_count, p.highest_wave,
                           count(s.id)::integer as total_sessions,
                           coalesce(sum(s.total_seconds), 0)::bigint as play_seconds,
                           max(coalesce(s.ended_at, s.last_heartbeat_at, s.started_at)) as last_session_at
                    from public.profiles p
                    join public.mb_game_sessions s on s.user_id = p.id
                    group by p.id
                    order by coalesce(sum(s.total_seconds), 0) desc, count(s.id) desc
                    limit 5
                ) a
            ) q
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

revoke all on function public.mb_get_game_activity_stats(uuid) from public, anon;
grant execute on function public.mb_get_game_activity_stats(uuid) to authenticated;
