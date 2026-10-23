create or replace function public.mb_get_population_stats()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
    with clock as (
        select pg_catalog.now() as checked_at
    ),
    population as (
        select
            p.display_name,
            p.rebirth_count,
            p.highest_wave,
            pr.last_seen_at
        from public.profiles as p
        left join public.mb_player_presence as pr on pr.user_id = p.id
    ),
    rebirth_counts as (
        select p.rebirth_count, pg_catalog.count(*)::integer as players
        from public.profiles as p
        group by p.rebirth_count
    ),
    recent_players as (
        select p.display_name, p.rebirth_count, p.highest_wave, p.last_seen_at
        from population as p
        where p.last_seen_at is not null
        order by p.last_seen_at desc
        limit 5
    )
    select pg_catalog.jsonb_build_object(
        'total_players', (select pg_catalog.count(*)::integer from public.profiles),
        'online_players', (
            select pg_catalog.count(*)::integer
            from population as p cross join clock as c
            where p.last_seen_at >= c.checked_at - interval '2 minutes'
        ),
        'active_24h', (
            select pg_catalog.count(*)::integer
            from population as p cross join clock as c
            where p.last_seen_at >= c.checked_at - interval '24 hours'
        ),
        'active_7d', (
            select pg_catalog.count(*)::integer
            from population as p cross join clock as c
            where p.last_seen_at >= c.checked_at - interval '7 days'
        ),
        'last_activity_at', (select pg_catalog.max(p.last_seen_at) from population as p),
        'rebirth_distribution', (
            select coalesce(
                pg_catalog.jsonb_agg(
                    pg_catalog.jsonb_build_object(
                        'rebirth', r.rebirth_count,
                        'players', r.players
                    )
                    order by r.players desc, r.rebirth_count asc
                ),
                '[]'::jsonb
            )
            from rebirth_counts as r
        ),
        'most_popular_rebirth', (
            select pg_catalog.jsonb_build_object('rebirth', r.rebirth_count, 'players', r.players)
            from rebirth_counts as r
            order by r.players desc, r.rebirth_count asc
            limit 1
        ),
        'recent_players', (
            select coalesce(
                pg_catalog.jsonb_agg(
                    pg_catalog.jsonb_build_object(
                        'display_name', r.display_name,
                        'rebirth', r.rebirth_count,
                        'highest_wave', r.highest_wave,
                        'last_seen_at', r.last_seen_at
                    )
                    order by r.last_seen_at desc
                ),
                '[]'::jsonb
            )
            from recent_players as r
        )
    );
$function$;

revoke all on function public.mb_get_population_stats() from public, anon;
grant execute on function public.mb_get_population_stats() to authenticated;
