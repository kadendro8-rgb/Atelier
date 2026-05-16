-- Atelier — development seed data.
--
-- Populates one realistic end-to-end test project: an Indianapolis infill lot,
-- a 3-bed modern-farmhouse brief, and a minimal plan-graph stub (schema v1,
-- shape per lib/kernel/types.ts). Plus a test builder profile that owns it.
--
-- Apply after the migrations, against a development database only:
--   supabase db reset            (runs migrations + this seed)
--   psql "$DATABASE_URL" -f supabase/seed.sql
--
-- Idempotent: re-running upserts the same rows by fixed UUIDs.

-- A profile's id references auth.users; create the auth user first so the
-- foreign key holds. The fixed UUID lets every other seed row reference it.
insert into auth.users (id, email, created_at, updated_at)
values (
  '00000000-0000-4000-8000-000000000001',
  'test.builder@atelier.dev',
  now(),
  now()
)
on conflict (id) do nothing;

-- Test builder profile (owns the seed project).
insert into public.profiles (
  id, role, display_name, company_name, phone, plan, created_at, updated_at
)
values (
  '00000000-0000-4000-8000-000000000001',
  'builder',
  'Test Builder',
  'Heartland Custom Homes',
  '+1-317-555-0142',
  'studio',
  now(),
  now()
)
on conflict (id) do update set
  role = excluded.role,
  display_name = excluded.display_name,
  company_name = excluded.company_name,
  phone = excluded.phone,
  plan = excluded.plan,
  updated_at = now();

-- Seed project: an Indianapolis lot with a 3-bed modern-farmhouse brief and a
-- minimal single-level plan-graph stub (two rooms, a wall, a door).
insert into public.projects (
  id, owner_id, name, slug, address, parcel_geojson, brief, plan_graph,
  status, design_fee_cents, construction_estimate_cents, created_at, updated_at
)
values (
  '00000000-0000-4000-8000-0000000000a1',
  '00000000-0000-4000-8000-000000000001',
  'Maple Street Farmhouse',
  'maple-street-farmhouse',
  '1842 N Maple St, Indianapolis, IN 46208',
  jsonb_build_object(
    'type', 'Feature',
    'properties', jsonb_build_object(
      'parcelId', '49-08-12-104-017.000-101',
      'lotAreaSqft', 8100,
      'zoning', 'D5'
    ),
    'geometry', jsonb_build_object(
      'type', 'Polygon',
      'coordinates', jsonb_build_array(jsonb_build_array(
        jsonb_build_array(-86.1610, 39.8120),
        jsonb_build_array(-86.1604, 39.8120),
        jsonb_build_array(-86.1604, 39.8132),
        jsonb_build_array(-86.1610, 39.8132),
        jsonb_build_array(-86.1610, 39.8120)
      ))
    )
  ),
  jsonb_build_object(
    'sqft', 2400,
    'beds', 3,
    'baths', 2.5,
    'style', 'modern farmhouse',
    'story_count', 2,
    'lot_size', '0.19 acres',
    'must_haves', jsonb_build_array(
      'open-concept living',
      'covered front porch',
      'home office',
      'mudroom off the garage'
    ),
    'optional_features', jsonb_build_array(
      'vaulted great room',
      'walkout lower level'
    ),
    'code_jurisdiction_hint', 'Indianapolis, IN'
  ),
  jsonb_build_object(
    'schemaVersion', 1,
    'seed', 42,
    'level', 'main',
    'bounds', jsonb_build_object('width', 18000, 'height', 12000),
    'rooms', jsonb_build_array(
      jsonb_build_object(
        'id', 'room-great',
        'label', 'Great Room',
        'use', 'great-room',
        'zone', 'public',
        'polygon', jsonb_build_array(
          jsonb_build_object('x', 0, 'y', 0),
          jsonb_build_object('x', 9000, 'y', 0),
          jsonb_build_object('x', 9000, 'y', 7000),
          jsonb_build_object('x', 0, 'y', 7000)
        ),
        'areaSqft', 678,
        'ceilingMm', 2700,
        'finishFloor', 'engineered-oak'
      ),
      jsonb_build_object(
        'id', 'room-kitchen',
        'label', 'Kitchen',
        'use', 'kitchen',
        'zone', 'public',
        'polygon', jsonb_build_array(
          jsonb_build_object('x', 9000, 'y', 0),
          jsonb_build_object('x', 14000, 'y', 0),
          jsonb_build_object('x', 14000, 'y', 7000),
          jsonb_build_object('x', 9000, 'y', 7000)
        ),
        'areaSqft', 377,
        'ceilingMm', 2700,
        'finishFloor', 'porcelain-tile'
      )
    ),
    'walls', jsonb_build_array(
      jsonb_build_object(
        'id', 'wall-1',
        'kind', 'interior',
        'start', jsonb_build_object('x', 9000, 'y', 0),
        'end', jsonb_build_object('x', 9000, 'y', 7000),
        'thicknessMm', 114
      )
    ),
    'openings', jsonb_build_array(
      jsonb_build_object(
        'id', 'opening-1',
        'kind', 'cased-opening',
        'wallId', 'wall-1',
        'offsetMm', 2500,
        'widthMm', 1800,
        'heightMm', 2100
      )
    ),
    'roof', 'gable'
  ),
  'draft',
  480000,
  62500000,
  now(),
  now()
)
on conflict (id) do update set
  owner_id = excluded.owner_id,
  name = excluded.name,
  slug = excluded.slug,
  address = excluded.address,
  parcel_geojson = excluded.parcel_geojson,
  brief = excluded.brief,
  plan_graph = excluded.plan_graph,
  status = excluded.status,
  design_fee_cents = excluded.design_fee_cents,
  construction_estimate_cents = excluded.construction_estimate_cents,
  updated_at = now();

-- A sample email-capture lead (reconciled `leads` table, with source).
insert into public.leads (id, email, brief, source, created_at)
values (
  '00000000-0000-4000-8000-0000000000b1',
  'prospect@example.com',
  'Looking for a 3-bed farmhouse on a small Indianapolis lot.',
  'builder',
  now()
)
on conflict (id) do nothing;
