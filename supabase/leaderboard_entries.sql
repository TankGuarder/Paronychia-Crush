create table if not exists public.leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  nickname text not null,
  score integer not null check (score > 0),
  completed_level integer not null check (completed_level >= 0),
  line_user_id text,
  created_at timestamptz not null default now()
);

create index if not exists leaderboard_entries_rank_idx
  on public.leaderboard_entries (score desc, completed_level desc, created_at asc);

alter table public.leaderboard_entries enable row level security;

drop policy if exists "Anyone can insert leaderboard entries" on public.leaderboard_entries;
create policy "Anyone can insert leaderboard entries"
  on public.leaderboard_entries
  for insert
  to anon
  with check (
    length(trim(nickname)) > 0
    and score > 0
    and completed_level >= 0
  );

drop policy if exists "Anyone can read leaderboard entries" on public.leaderboard_entries;
create policy "Anyone can read leaderboard entries"
  on public.leaderboard_entries
  for select
  to anon
  using (true);
