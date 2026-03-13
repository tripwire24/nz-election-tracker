-- Add voter_hash column for IP-based vote deduplication
alter table public.user_polls add column if not exists voter_hash text;

-- Unique constraint to prevent duplicate votes
create unique index if not exists idx_user_polls_voter_hash on public.user_polls (voter_hash) where voter_hash is not null;
