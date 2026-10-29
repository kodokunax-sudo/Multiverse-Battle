-- In game.js wave advances immediately after victory, so clearing wave 1500 yields a highest-wave counter of 1501.
update public.mb_achievement_title_reward_catalog
   set stat_min = 1501
 where title_id = 'multiverse_parasite';

-- The reward catalogue has no client read grants. Add a deny policy as defense in depth.
drop policy if exists mb_achievement_title_reward_catalog_deny_clients
    on public.mb_achievement_title_reward_catalog;
create policy mb_achievement_title_reward_catalog_deny_clients
    on public.mb_achievement_title_reward_catalog
    for all to anon, authenticated
    using (false)
    with check (false);
