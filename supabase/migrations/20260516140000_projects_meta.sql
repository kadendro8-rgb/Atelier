-- W2 — Site Intelligence: add the `meta` column to projects.
--
-- The lot picker stores its site-intelligence payload (neighbour buildings,
-- streets, the USGS 3DEP elevation grid) under `projects.meta`, namespaced as
-- `meta.site` so future workers can add sibling keys without collision.
--
-- Foreman correction (canonical form): NOT NULL with a '{}' default so every
-- project always carries a meta object, plus a GIN index for jsonb querying.

alter table public.projects
  add column meta jsonb not null default '{}'::jsonb;

create index projects_meta_idx on public.projects using gin (meta);
