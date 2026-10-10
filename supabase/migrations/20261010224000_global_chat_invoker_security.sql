-- Tighten global chat sends: the callable RPC uses caller privileges;
-- a non-callable trigger enforces identity, server timestamps and rate limits.
revoke insert on table public.global_chat_messages from public, anon, authenticated;
grant insert (user_id, message) on table public.global_chat_messages to authenticated;

drop policy if exists global_chat_insert_own on public.global_chat_messages;
create policy global_chat_insert_own
on public.global_chat_messages for insert to authenticated
with check ((select auth.uid()) = user_id);

create or replace function public.mb_prepare_global_chat_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_uid uuid := auth.uid();
    v_sender_name text;
    v_avatar_name text;
    v_recent_count integer;
begin
    if v_uid is null or new.user_id is distinct from v_uid then
        raise exception 'global_chat_auth_required';
    end if;

    new.message := btrim(coalesce(new.message, ''));
    if new.message = '' then
        raise exception 'global_chat_empty';
    end if;
    if char_length(new.message) > 300 then
        raise exception 'global_chat_too_long';
    end if;

    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text, 0));

    select p.display_name, p.avatar_name
      into v_sender_name, v_avatar_name
      from public.profiles as p
     where p.id = v_uid;
    if not found then
        raise exception 'profile_not_found';
    end if;

    select count(*)::integer
      into v_recent_count
      from public.global_chat_messages as m
     where m.user_id = v_uid
       and m.created_at > pg_catalog.clock_timestamp() - interval '10 seconds';
    if v_recent_count >= 5 then
        raise exception 'global_chat_rate_limited';
    end if;

    -- Never trust display metadata or timestamps sent by the browser.
    new.sender_name := coalesce(nullif(btrim(v_sender_name), ''), 'Игрок');
    new.avatar_name := coalesce(nullif(btrim(v_avatar_name), ''), 'Дио');
    new.created_at := pg_catalog.clock_timestamp();
    return new;
end;
$$;

revoke all on function public.mb_prepare_global_chat_message() from public, anon, authenticated;

drop trigger if exists global_chat_prepare_before_insert on public.global_chat_messages;
create trigger global_chat_prepare_before_insert
before insert on public.global_chat_messages
for each row execute function public.mb_prepare_global_chat_message();

create or replace function public.mb_send_global_chat_message(p_message text)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
    v_uid uuid := auth.uid();
    v_message text := btrim(coalesce(p_message, ''));
    v_row record;
begin
    if v_uid is null then
        raise exception 'global_chat_auth_required';
    end if;
    if v_message = '' then
        raise exception 'global_chat_empty';
    end if;
    if char_length(v_message) > 300 then
        raise exception 'global_chat_too_long';
    end if;

    insert into public.global_chat_messages (user_id, message)
    values (v_uid, v_message)
    returning id, user_id, sender_name, avatar_name, message, created_at into v_row;

    return jsonb_build_object(
        'id', v_row.id,
        'user_id', v_row.user_id,
        'sender_name', v_row.sender_name,
        'avatar_name', v_row.avatar_name,
        'message', v_row.message,
        'created_at', v_row.created_at
    );
end;
$$;

revoke all on function public.mb_send_global_chat_message(text) from public, anon;
grant execute on function public.mb_send_global_chat_message(text) to authenticated;
