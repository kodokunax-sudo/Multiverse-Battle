-- Cover the user foreign key for profile deletion and lookup maintenance.
create index if not exists clan_messages_user_id_idx
    on public.clan_messages (user_id);
