-- Project type: broaden Atelier from a single project kind (custom home) to a
-- multi-type building market (home, hardscape, room, garage, gym).
--
-- This is the data-layer foundation only — UI pickers and non-home design
-- generators ship in follow-on migrations. The `'home'` default keeps every
-- existing project row valid without backfill.

alter table public.projects
  add column project_type text not null default 'home'
  check (project_type in ('home','hardscape','room','garage','gym'));
