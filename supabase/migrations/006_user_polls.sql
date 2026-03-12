-- Anonymous user polling / voting intention
create table if not exists public.user_polls (
  id uuid primary key default gen_random_uuid(),
  party_vote text not null,
  electorate_vote text,            -- optional electorate candidate/party
  age_bracket text,                -- e.g. '18-24', '25-34', etc.
  region text,                     -- e.g. 'Auckland', 'Wellington', etc.
  created_at timestamptz not null default now()
);

-- RLS: anyone can insert, nobody can read individual rows (only aggregated via API)
alter table public.user_polls enable row level security;

create policy "Anyone can submit a poll response" on public.user_polls
  for insert with check (true);

-- Service role can read for aggregation
create policy "Service role reads user_polls" on public.user_polls
  for select using (auth.role() = 'service_role');
