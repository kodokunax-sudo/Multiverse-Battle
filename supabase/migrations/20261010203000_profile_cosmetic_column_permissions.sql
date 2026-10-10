-- New profile cosmetics are readable by authenticated users, but need explicit
-- column-level UPDATE grants because earlier profile permissions were column-scoped.
grant update (active_title, showcase_cards) on table public.profiles to authenticated;
