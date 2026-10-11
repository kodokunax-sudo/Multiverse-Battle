-- Public profile activity: exact account creation time, last game presence and online state.
-- Presence stays private; authenticated clients read it only through a narrow RPC.

insert into public.mb_player_presence (user_id, last_seen_at)
select u.id, u.last_sign_in_at
from auth.users as u
where u.last_sign_in_at is not null
on conflict (user_id) do nothing;

create or replace function public.mb_get_player_activity(p_user_id uuid)
returns table (
    account_created_at timestamptz,
    last_seen_at timestamptz,
    is_online boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_uid uuid := auth.uid();
begin
    if v_uid is null then
        raise exception 'auth_required' using errcode = '28000';
    end if;
    if p_user_id is null then
        raise exception 'profile_not_found' using errcode = '22023';
    end if;

    return query
    select
        u.created_at,
        coalesce(pr.last_seen_at, u.last_sign_in_at),
        coalesce(pr.last_seen_at >= pg_catalog.clock_timestamp() - interval '2 minutes', false)
    from auth.users as u
    left join public.mb_player_presence as pr on pr.user_id = u.id
    where u.id = p_user_id;
end;
$$;

revoke all on function public.mb_get_player_activity(uuid) from public, anon;
grant execute on function public.mb_get_player_activity(uuid) to authenticated;
