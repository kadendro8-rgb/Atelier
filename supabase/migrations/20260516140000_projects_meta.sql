-- W2 — Site Intelligence: add a freeform `meta` column to projects.
--
-- The lot picker stores neighbour buildings, streets, and the USGS 3DEP
-- elevation grid under `projects.meta`. Keeping it in a single jsonb column
-- (rather than new tables) keeps the site-intelligence payload decoupled from
-- the core schema while W2's shape is still settling.

alter table public.projects add column if not exists meta jsonb;
