-- Lead capture for the builder's "Save brief and come back later" flow.
-- Apply via the Supabase SQL editor or `supabase db push`.

create table if not exists public.leads (
  id         uuid        primary key default gen_random_uuid(),
  email      text        not null,
  brief      text        not null default '',
  created_at timestamptz not null default now()
);

-- Row-level security on. The API route uses the service-role key, which
-- bypasses RLS; with no policies defined, the public anon key can neither
-- read nor write leads.
alter table public.leads enable row level security;
