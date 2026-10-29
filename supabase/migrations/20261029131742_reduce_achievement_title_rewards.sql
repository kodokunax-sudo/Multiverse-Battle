-- Reduce every achievement-title reward by at least 10x.
-- Do not retract completed claims; only future rewards and any pending payout are scaled.
begin;

update public.mb_achievement_title_reward_catalog
set reward_stars = greatest(1, floor(reward_stars::numeric / 10)::integer),
    reward_power_points = greatest(0, floor(reward_power_points::numeric / 10)::integer),
    reward_free_spins = greatest(0, floor(reward_free_spins::numeric / 10)::integer),
    reward_legendary_spins = greatest(0, floor(reward_legendary_spins::numeric / 10)::integer),
    reward_secret_spins = greatest(0, floor(reward_secret_spins::numeric / 10)::integer);

update public.mb_title_reward_claims
set reward_points = greatest(1, floor(reward_points::numeric / 10)::integer),
    reward_power_points = greatest(0, floor(reward_power_points::numeric / 10)::integer),
    reward_free_spins = greatest(0, floor(reward_free_spins::numeric / 10)::integer),
    reward_legendary_spins = greatest(0, floor(reward_legendary_spins::numeric / 10)::integer),
    reward_secret_spins = greatest(0, floor(reward_secret_spins::numeric / 10)::integer)
where granted_at is null;

commit;