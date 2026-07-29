# Backlog (one-liners only — scope-creep parking lot)

- Real PRODUCT_SPEC.md missing — commit it and reconcile placeholder assumptions (highest priority)
- Replace placeholder Jordan Carter seed with exact spec §16 dataset
- Net-worth trend chart once snapshots accumulate (M2+, data first)
- Rate limiting + login lockout (pre-public requirement)
- Row-level security in Postgres to back the app-layer household scoping
- `attributes JSONB` on household_members when first ABAC need appears
- Household member invitation flow
- Prisma seed idempotency → upgrade to upsert-by-natural-key when seed grows
- Currency support beyond USD (schema stores currency code already; math is single-currency)
- Extract /passportiq to its own repository when the founder is ready
- `entity_stakes` table when entities can have multiple owners (M1: `legal_entities.ownerStakePct`)
