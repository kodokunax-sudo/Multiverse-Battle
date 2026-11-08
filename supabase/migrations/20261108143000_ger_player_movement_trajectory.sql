create table if not exists public.ger_player_movement_trajectory_chunks (
    session_id uuid not null references public.ger_training_sessions(id) on delete cascade,
    player_id uuid not null,
    boss_key text not null,
    chunk_index integer not null check (chunk_index >= 0 and chunk_index <= 60),
    sample_count smallint not null check (sample_count between 1 and 300),
    samples jsonb not null check (
        jsonb_typeof(samples) = 'array'
        and jsonb_array_length(samples) = sample_count
    ),
    created_at timestamptz not null default now(),
    primary key (session_id, chunk_index)
);

create index if not exists ger_player_movement_trajectory_owner_idx
    on public.ger_player_movement_trajectory_chunks (player_id, boss_key, created_at desc);

alter table public.ger_player_movement_trajectory_chunks enable row level security;
revoke all on table public.ger_player_movement_trajectory_chunks from public, anon, authenticated;
