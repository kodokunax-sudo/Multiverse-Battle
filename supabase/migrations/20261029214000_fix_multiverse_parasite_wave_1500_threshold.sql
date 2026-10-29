-- The "Мое темное прошлое" title unlocks on the completed 1500th wave.
-- Keep the client title definition and server-side claim validator in sync.
update public.mb_achievement_title_reward_catalog
   set stat_min = 1500
 where title_id = 'multiverse_parasite'
   and stat_key = 'highest_wave'
   and stat_min <> 1500;
