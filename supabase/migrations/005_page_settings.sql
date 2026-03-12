-- Page visibility settings for CMS admin
create table if not exists public.page_settings (
  slug text primary key,
  label text not null,
  visible boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Seed all current pages
insert into public.page_settings (slug, label, visible) values
  ('polls', 'Polls', true),
  ('forecast', 'Forecast', true),
  ('sentiment', 'Sentiment', true),
  ('map', 'Map', true),
  ('feed', 'Feed', true),
  ('poll', 'Your Vote', true),
  ('blog', 'Blog', true),
  ('roadmap', 'Roadmap', false),
  ('contact', 'Contact', true)
on conflict (slug) do nothing;

-- Anyone can read (nav-bar needs this on the public site)
alter table public.page_settings enable row level security;
create policy "Public read page_settings" on public.page_settings
  for select using (true);

-- Only service-role (admin API routes) can update
create policy "Service role manages page_settings" on public.page_settings
  for all using (auth.role() = 'service_role');

-- Auto-update timestamp
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger page_settings_updated_at
  before update on public.page_settings
  for each row execute function public.set_updated_at();
