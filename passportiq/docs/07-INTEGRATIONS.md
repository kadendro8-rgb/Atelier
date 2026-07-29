# 07 — Integrations: REAL / MOCKED / DEFERRED

Every mocked surface is labeled MOCK in code (type/class names, file headers) and visibly labeled
as demo data in the UI. Nothing may claim to connect, verify, or comply unless implemented and
tested.

## REAL (implemented and tested in M1)

| Surface | Implementation |
|---|---|
| Authentication | `AuthProvider` interface + `LocalAuthProvider` (bcrypt, Postgres sessions). Swappable for Clerk/Auth0/passkeys without touching call sites. |
| Database | PostgreSQL via Prisma; Docker Compose for local dev |
| Object storage | `ObjectStore` interface + `LocalDiskObjectStore` writing under `var/objects/` (gitignored). M1 has no upload UI; the stub exists so M2 doesn't invent storage ad hoc. |

## MOCKED (M2 — interfaces defined now)

| Surface | Shape |
|---|---|
| Account aggregation | `ProviderAdapter` interface shaped for Plaid-class providers (`listAccounts`, `listHoldings`, `listLiabilities`, provenance + `asOf` on every record). M2 ships `MockAggregationProvider` only; every record it emits carries `source: 'MOCK_AGGREGATION'` and renders with a DEMO badge. There is **no** "connect your bank" UI until a real provider exists — a mocked connect flow would itself be a fake integration. |
| Document field extraction | Returns hand-seeded values only, marked `extractionMethod: 'MOCK_SEEDED'`. |

## DEFERRED (no code, named boundaries only)

- Identity verification (KYC) — licensed vendor + attorney first
- Third-party verifier workflow
- Credential cryptography / QR verifiable credentials
- Opportunities marketplace
- Institutional portal
- Payments/billing
- Real aggregation providers (Plaid/MX/Finicity)
- Email delivery (no email in M1; signup is seeded/dev-only)

## Environment note (this build session)

The remote build environment's egress allowlist blocks `registry.npmjs.org`, which blocks
dependency installation (and `binaries.prisma.sh` will be needed for Prisma engines). This is a
build-environment constraint, not a product integration; recorded here so the dependency state of
the repo is not mistaken for a design choice.
