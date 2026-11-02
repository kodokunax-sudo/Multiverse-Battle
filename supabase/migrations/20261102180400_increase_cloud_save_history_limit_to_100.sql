-- Keep the newest 100 cloud-save history revisions per account.
-- Older history rows are pruned automatically after every archived revision.

create or replace function public.prune_player_cloud_save_history()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog'
as $function$
begin
    perform pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(new.user_id::text, 0)
    );

    delete from public.player_cloud_save_history h
    where h.id in (
        select old_rows.id
        from public.player_cloud_save_history old_rows
        where old_rows.user_id = new.user_id
        order by old_rows.archived_at desc, old_rows.id desc
        offset 100
    );

    return new;
end;
$function$;

-- Apply the same retention limit to history that already exists.
with ranked as (
    select id,
           row_number() over (
               partition by user_id
               order by archived_at desc, id desc
           ) as position
    from public.player_cloud_save_history
)
delete from public.player_cloud_save_history h
using ranked r
where h.id = r.id
  and r.position > 100;
