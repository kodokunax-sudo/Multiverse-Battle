-- Restrict unique-boss analytics to the account whose email starts with "Kodoku".
-- Keep collecting attempts for every player, but only the designated account can read analytics.

alter function public.mb_get_unique_boss_fight_stats(uuid)
    rename to mb_get_unique_boss_fight_stats_unrestricted;

revoke all on function public.mb_get_unique_boss_fight_stats_unrestricted(uuid)
    from public, anon, authenticated;

create or replace function public.mb_get_unique_boss_fight_stats(p_user_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
    v_uid uuid := auth.uid();
begin
    if v_uid is null then
        raise exception 'auth_required' using errcode = '28000';
    end if;

    if not exists (
        select 1
        from auth.users u
        where u.id = v_uid
          and lower(coalesce(u.email, '')) like 'kodoku%'
    ) then
        raise exception 'unique_boss_analytics_forbidden' using errcode = '42501';
    end if;

    return public.mb_get_unique_boss_fight_stats_unrestricted(p_user_id);
end;
$function$;

revoke all on function public.mb_get_unique_boss_fight_stats(uuid) from public, anon;
grant execute on function public.mb_get_unique_boss_fight_stats(uuid) to authenticated;
