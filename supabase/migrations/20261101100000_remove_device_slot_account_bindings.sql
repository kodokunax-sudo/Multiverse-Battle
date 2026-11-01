-- Remove the old per-device account-to-slot registry entirely.
-- Cloud saves remain tied to Supabase accounts, while local game slots are independent.
drop function if exists public.claim_multiverse_slot_account(uuid, integer, boolean);
drop table if exists public.multiverse_device_slot_accounts;
notify pgrst, 'reload schema';
