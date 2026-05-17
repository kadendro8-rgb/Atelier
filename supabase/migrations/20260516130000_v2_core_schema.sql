-- Atelier v2.0 core schema.
--
-- Source: the Enterprise Build Plan, Phase 0 / Day 3. Version-controlled here;
-- apply via the Supabase SQL editor or `supabase db push`.
--
-- NOTE: `leads` (migration 20260516120000) is the single email-capture table.
-- An earlier draft of this migration introduced a duplicate `saved_briefs`;
-- it has been reconciled away — instead of a new table we fold the extra
-- columns (`source`, `resume_token`) into `leads` via ALTER below. The
-- /api/save-brief route keeps writing to `leads` unchanged.

-- Profiles (auth.users is auto-created by Supabase Auth)
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null default 'builder' check (role in ('builder','client','architect','admin','staff')),
  display_name text,
  company_name text,
  phone text,
  avatar_url text,
  stripe_customer_id text,
  stripe_connect_account_id text,
  plan text not null default 'free' check (plan in ('free','solo','studio','firm')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Projects (the unit of work)
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles on delete cascade,
  client_id uuid references public.profiles on delete set null,
  name text not null,
  slug text unique not null,
  address text,
  parcel_geojson jsonb,
  brief jsonb,
  plan_graph jsonb,
  status text not null default 'draft' check (status in ('draft','review','funded','built','archived')),
  share_token text unique default encode(gen_random_bytes(16),'hex'),
  design_fee_cents integer,
  deposit_cents integer,
  construction_estimate_cents integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Renders (the 6 hero shots per project, plus user-generated)
create table public.renders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  angle text not null,
  time_of_day text not null,
  resolution text not null,
  storage_path text not null,
  rendered_at timestamptz not null default now()
);

-- Comments on the client portal (multiplayer review)
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  author_id uuid references public.profiles,
  author_name text not null,
  body text not null,
  view_id text,
  pin_x real,
  pin_y real,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

-- Stamp partner applications
create table public.stamp_applicants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  state text not null,
  license_number text not null,
  license_type text,
  email text not null,
  years_practicing integer,
  expected_rate_cents integer,
  status text not null default 'pending' check (status in ('pending','approved','rejected','active','paused')),
  applied_at timestamptz not null default now()
);

-- Stamp jobs (project routed to a partner)
create table public.stamp_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  partner_id uuid references public.profiles,
  status text not null default 'queued' check (status in ('queued','assigned','accepted','stamped','rejected')),
  fee_cents integer not null,
  partner_payout_cents integer not null,
  atelier_take_cents integer not null,
  stamped_pdf_path text,
  assigned_at timestamptz,
  stamped_at timestamptz
);

-- Outreach events (drives the marketing dashboard)
create table public.outreach_events (
  id uuid primary key default gen_random_uuid(),
  persona text not null check (persona in ('builder','architect','firm','client')),
  target_email text not null,
  target_name text,
  target_company text,
  target_state text,
  cadence_day integer,
  event_type text not null check (event_type in ('sent','opened','clicked','replied','booked','unsubscribed')),
  occurred_at timestamptz not null default now()
);

-- Saved briefs: reconciled into the existing `leads` table rather than a
-- duplicate `saved_briefs`. Fold in the extra email-capture columns.
alter table public.leads add column if not exists source text;
alter table public.leads add column if not exists resume_token text unique default encode(gen_random_bytes(16),'hex');

-- GMV tracking
create table public.gmv_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  amount_cents integer not null,
  type text not null check (type in ('deposit','design_fee','stamp_fee','builder_referral')),
  stripe_payment_intent_id text,
  occurred_at timestamptz not null default now()
);

-- Enable RLS on everything user-facing
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.renders enable row level security;
alter table public.comments enable row level security;
alter table public.stamp_jobs enable row level security;
alter table public.gmv_events enable row level security;

-- Basic policies (expand as features ship)
create policy "profiles: self-read" on public.profiles for select using (auth.uid() = id);
create policy "profiles: self-write" on public.profiles for update using (auth.uid() = id);
create policy "projects: owner-rw" on public.projects for all using (auth.uid() = owner_id);
create policy "projects: client-read" on public.projects for select using (auth.uid() = client_id);
create policy "projects: public-share" on public.projects for select using (share_token is not null);
create policy "comments: project-members" on public.comments for all using (
  exists (select 1 from public.projects p
    where p.id = comments.project_id
    and (p.owner_id = auth.uid() or p.client_id = auth.uid()))
);

-- Realtime channels
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.projects;
