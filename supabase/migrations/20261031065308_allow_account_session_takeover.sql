-- Allow a newly authenticated client to take over the active game session.
-- This removes the login deadlock while keeping cloud-save writes bound to the newest session.
create or replace function public.mb_claim_active_account_session(
    p_session_id uuid,
    p_auth_session_id uuid,
    p_device_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
    v_uid uuid := auth.uid();
    v_token_session_id uuid := nullif(auth.jwt() ->> 'session_id', '')::uuid;
    v_now timestamptz := pg_catalog.clock_timestamp();
    v_existing public.mb_active_account_sessions%rowtype;
begin
    if v_uid is null then
        return jsonb_build_object('ok', false, 'code', 'auth_required', 'message', 'Сначала войди в аккаунт.');
    end if;

    if p_session_id is null or p_device_id is null or v_token_session_id is null
       or p_auth_session_id is distinct from v_token_session_id then
        return jsonb_build_object('ok', false, 'code', 'invalid_session', 'message', 'Не удалось проверить сессию аккаунта. Перезайди в игру.');
    end if;

    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text, 0));

    select s.* into v_existing
      from public.mb_active_account_sessions s
     where s.user_id = v_uid
     for update;

    insert into public.mb_active_account_sessions(
        user_id, client_session_id, auth_session_id, device_id, started_at, last_seen_at
    )
    values (v_uid, p_session_id, v_token_session_id, p_device_id, v_now, v_now)
    on conflict (user_id) do update
       set client_session_id = excluded.client_session_id,
           auth_session_id = excluded.auth_session_id,
           device_id = excluded.device_id,
           started_at = case
               when public.mb_active_account_sessions.client_session_id = excluded.client_session_id
                and public.mb_active_account_sessions.auth_session_id = excluded.auth_session_id
               then public.mb_active_account_sessions.started_at
               else excluded.started_at
           end,
           last_seen_at = excluded.last_seen_at;

    return jsonb_build_object(
        'ok', true,
        'session_id', p_session_id,
        'started_at', case
            when found then coalesce(v_existing.started_at, v_now)
            else v_now
        end
    );
end;
$function$;

revoke all on function public.mb_claim_active_account_session(uuid, uuid, uuid) from public, anon;
grant execute on function public.mb_claim_active_account_session(uuid, uuid, uuid) to authenticated;
