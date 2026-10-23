-- Only measured session time is included in playtime totals and the leaderboard.
-- The pre-analytics estimate remains visible as a separate, explicitly approximate field.
CREATE OR REPLACE FUNCTION public.mb_get_game_activity_stats(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
    v_uid uuid := auth.uid();
    v_target uuid := coalesce(p_user_id, auth.uid());
    v_result jsonb;
begin
    if v_uid is null then
        raise exception 'auth_required' using errcode = '28000';
    end if;
    if v_target is null or not exists (
        select 1 from public.profiles p where p.id = v_target
    ) then
        raise exception 'profile_not_found' using errcode = 'P0002';
    end if;

    select jsonb_build_object(
        'player', (
            select jsonb_build_object(
                'total_sessions', a.total_sessions,
                'play_seconds', a.measured_play_seconds,
                'measured_play_seconds', a.measured_play_seconds,
                'estimated_prior_seconds', a.estimated_prior_seconds,
                'average_session_seconds', a.average_session_seconds,
                'sessions_7d', a.sessions_7d,
                'last_session_at', a.last_session_at,
                'progress', a.progress
            )
            from (
                select
                    s.total_sessions,
                    s.measured_play_seconds,
                    coalesce(b.estimated_prior_seconds, 0)::bigint as estimated_prior_seconds,
                    s.average_session_seconds,
                    s.sessions_7d,
                    s.last_session_at,
                    jsonb_build_object(
                        'total_wins', p.total_wins,
                        'highest_wave', p.highest_wave,
                        'rebirth_count', p.rebirth_count,
                        'cards_collected', p.cards_collected,
                        'bosses_defeated', p.bosses_defeated,
                        'total_clicks', p.total_clicks,
                        'lifetime_stats', p.lifetime_stats,
                        'current_rebirth_stats', p.current_rebirth_stats
                    ) as progress
                from public.profiles p
                left join lateral (
                    select
                        count(*)::integer as total_sessions,
                        coalesce(sum(gs.total_seconds), 0)::bigint as measured_play_seconds,
                        coalesce(round(avg(gs.total_seconds)), 0)::bigint as average_session_seconds,
                        count(*) filter (
                            where gs.started_at >= pg_catalog.now() - interval '7 days'
                        )::integer as sessions_7d,
                        max(coalesce(gs.ended_at, gs.last_heartbeat_at, gs.started_at)) as last_session_at
                    from public.mb_game_sessions gs
                    where gs.user_id = p.id
                ) s on true
                left join public.mb_game_time_baselines b on b.user_id = p.id
                where p.id = v_target
            ) a
        ),
        'player_top_stages', (
            select coalesce(
                jsonb_agg(q.payload order by q.play_seconds desc, q.visits desc),
                '[]'::jsonb
            )
            from (
                select jsonb_build_object(
                    'stage_key', v.stage_key,
                    'stage_label', v.stage_label,
                    'visits', v.visits,
                    'sessions', v.sessions,
                    'play_seconds', v.play_seconds,
                    'last_seen_at', v.last_seen_at
                ) as payload, v.play_seconds, v.visits
                from (
                    select
                        sv.stage_key,
                        max(sv.stage_label) as stage_label,
                        sum(sv.entry_count)::bigint as visits,
                        count(distinct sv.session_id)::integer as sessions,
                        sum(sv.total_seconds)::bigint as play_seconds,
                        max(sv.last_seen_at) as last_seen_at
                    from public.mb_game_stage_visits sv
                    where sv.user_id = v_target
                    group by sv.stage_key
                    order by sum(sv.total_seconds) desc, sum(sv.entry_count) desc
                    limit 5
                ) v
            ) q
        ),
        'server', (
            select jsonb_build_object(
                'total_players', (select count(*)::integer from public.profiles),
                'online_now', (
                    select count(distinct s.user_id)::integer
                    from public.mb_game_sessions s
                    where s.ended_at is null
                      and s.paused_at is null
                      and s.last_heartbeat_at >= pg_catalog.now() - interval '2 minutes'
                ),
                'active_24h', (
                    select count(distinct s.user_id)::integer
                    from public.mb_game_sessions s
                    where s.last_heartbeat_at >= pg_catalog.now() - interval '24 hours'
                ),
                'active_7d', (
                    select count(distinct s.user_id)::integer
                    from public.mb_game_sessions s
                    where s.last_heartbeat_at >= pg_catalog.now() - interval '7 days'
                ),
                'total_sessions', (select count(*)::integer from public.mb_game_sessions),
                'measured_play_seconds', (
                    select coalesce(sum(s.total_seconds), 0)::bigint from public.mb_game_sessions s
                ),
                'estimated_prior_seconds', (
                    select coalesce(sum(b.estimated_prior_seconds), 0)::bigint
                    from public.mb_game_time_baselines b
                ),
                'play_seconds', (
                    select coalesce(sum(s.total_seconds), 0)::bigint from public.mb_game_sessions s
                )
            )
        ),
        'server_top_players', (
            select coalesce(
                jsonb_agg(q.payload order by q.play_seconds desc, q.total_sessions desc, q.display_name),
                '[]'::jsonb
            )
            from (
                select
                    jsonb_build_object(
                        'display_name', a.display_name,
                        'rebirth', a.rebirth_count,
                        'highest_wave', a.highest_wave,
                        'total_wins', a.total_wins,
                        'cards_collected', a.cards_collected,
                        'bosses_defeated', a.bosses_defeated,
                        'total_clicks', a.total_clicks,
                        'total_sessions', a.total_sessions,
                        'play_seconds', a.play_seconds,
                        'measured_play_seconds', a.measured_play_seconds,
                        'estimated_prior_seconds', a.estimated_prior_seconds,
                        'last_session_at', a.last_session_at
                    ) as payload,
                    a.play_seconds,
                    a.total_sessions,
                    a.display_name
                from (
                    select
                        p.id,
                        p.display_name,
                        p.rebirth_count,
                        p.highest_wave,
                        p.total_wins,
                        p.cards_collected,
                        p.bosses_defeated,
                        p.total_clicks,
                        count(s.id)::integer as total_sessions,
                        coalesce(sum(s.total_seconds), 0)::bigint as measured_play_seconds,
                        coalesce(max(b.estimated_prior_seconds), 0)::bigint as estimated_prior_seconds,
                        coalesce(sum(s.total_seconds), 0)::bigint as play_seconds,
                        max(coalesce(s.ended_at, s.last_heartbeat_at, s.started_at)) as last_session_at
                    from public.profiles p
                    left join public.mb_game_sessions s on s.user_id = p.id
                    left join public.mb_game_time_baselines b on b.user_id = p.id
                    group by p.id
                    order by
                        coalesce(sum(s.total_seconds), 0) desc,
                        count(s.id) desc
                    limit 50
                ) a
            ) q
        ),
        'server_top_stages', (
            select coalesce(
                jsonb_agg(q.payload order by q.visits desc, q.play_seconds desc),
                '[]'::jsonb
            )
            from (
                select jsonb_build_object(
                    'stage_key', v.stage_key,
                    'stage_label', v.stage_label,
                    'players', v.players,
                    'visits', v.visits,
                    'sessions', v.sessions,
                    'play_seconds', v.play_seconds
                ) as payload, v.visits, v.play_seconds
                from (
                    select
                        sv.stage_key,
                        max(sv.stage_label) as stage_label,
                        count(distinct sv.user_id)::integer as players,
                        sum(sv.entry_count)::bigint as visits,
                        count(distinct sv.session_id)::integer as sessions,
                        sum(sv.total_seconds)::bigint as play_seconds
                    from public.mb_game_stage_visits sv
                    group by sv.stage_key
                    order by sum(sv.entry_count) desc, sum(sv.total_seconds) desc
                    limit 5
                ) v
            ) q
        )
    ) into v_result;

    return v_result;
end;
$function$

revoke all on function public.mb_get_game_activity_stats(uuid) from public, anon;
grant execute on function public.mb_get_game_activity_stats(uuid) to authenticated;
