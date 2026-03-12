-- Blog posts table
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  excerpt text,
  body text not null default '',
  author text,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.blog_posts enable row level security;

-- Public can read published posts
create policy "Public read published blog_posts" on public.blog_posts
  for select using (published = true);

-- Service role can do everything (admin API)
create policy "Service role full access blog_posts" on public.blog_posts
  for all using (current_setting('role') = 'service_role');

-- Auto-update updated_at
create or replace function public.blog_posts_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger blog_posts_updated_at_trigger
  before update on public.blog_posts
  for each row execute function public.blog_posts_updated_at();
