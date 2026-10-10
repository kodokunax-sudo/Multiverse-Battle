-- Rich player statistics: current rebirth, lifetime counters and per-rebirth history.
alter table public.profiles
    add column if not exists current_rebirth_stats jsonb not null default '{}'::jsonb,
    add column if not exists lifetime_stats jsonb not null default '{}'::jsonb,
    add column if not exists rebirth_history jsonb not null default '[]'::jsonb;

do $$
begin
    if not exists (
        select 1 from pg_catalog.pg_constraint
        where conname = 'profiles_current_rebirth_stats_object'
          and conrelid = 'public.profiles'::regclass
    ) then
        alter table public.profiles add constraint profiles_current_rebirth_stats_object
            check (pg_catalog.jsonb_typeof(current_rebirth_stats) = 'object');
    end if;
    if not exists (
        select 1 from pg_catalog.pg_constraint
        where conname = 'profiles_lifetime_stats_object'
          and conrelid = 'public.profiles'::regclass
    ) then
        alter table public.profiles add constraint profiles_lifetime_stats_object
            check (pg_catalog.jsonb_typeof(lifetime_stats) = 'object');
    end if;
    if not exists (
        select 1 from pg_catalog.pg_constraint
        where conname = 'profiles_rebirth_history_array'
          and conrelid = 'public.profiles'::regclass
    ) then
        alter table public.profiles add constraint profiles_rebirth_history_array
            check (
                pg_catalog.jsonb_typeof(rebirth_history) = 'array'
                and pg_catalog.jsonb_array_length(rebirth_history) <= 1000
            );
    end if;
end;
$$;

grant update (current_rebirth_stats, lifetime_stats, rebirth_history)
    on table public.profiles to authenticated;
