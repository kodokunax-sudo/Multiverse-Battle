-- Support session lookups/deletes via the stage-visits foreign key.
create index if not exists mb_game_stage_visits_session_id_idx
    on public.mb_game_stage_visits(session_id);
