# 04 — Security Model (Milestone 1, honestly stated)

**This is a pre-release development posture. No compliance, certification, audit, or pen-test is
claimed anywhere, because none has happened.**

## What M1 actually does

- **Transport encryption**: TLS is assumed at the deployment edge; local dev is HTTP on localhost.
  Session cookies are `httpOnly`, `sameSite=lax`, `secure` outside dev.
- **Credentials**: bcrypt (cost 12) via the local `AuthProvider`. Passwords never logged, never
  returned by any API. (Kickoff allowed argon2/bcrypt; bcrypt chosen — no native build fragility.)
- **Sessions**: 256-bit random opaque token; only its SHA-256 stored (`sessions.tokenHash`).
  Logout revokes the row; "revoke all sessions" supported by the interface. Expiry enforced
  server-side on every lookup.
- **Audit events**: append-only `audit_events` written by a typed writer on every mutating action
  (signup, login, logout, revocation, seed mutations, all M2 CRUD).
- **Secrets**: `.env` only, with a fully documented `.env.example`. No secrets in code, logs, or git.
- **Logging discipline**: no full account numbers, no SSNs (not even collected in M1), no
  credentials, no session tokens in logs.
- **RBAC**: see `05-PERMISSIONS.md`. All domain queries household-scoped.

## Designed now, implemented where cheap

- **Field-level encryption plan**: sensitive string fields (future: account numbers, tax IDs) get
  `*_enc` bytea columns encrypted with AES-256-GCM under a key from `FIELD_ENCRYPTION_KEY`, with a
  `keyVersion` column for rotation. M1 stores **no** such fields (account numbers are last-4 display
  strings only, by design), so the plan is documented but only the key slot exists in `.env.example`.

## DEFERRED and untested (explicit)

- MFA / passkeys (auth interface leaves room; stated deferral)
- Rate limiting / lockout on login attempts
- CSRF hardening beyond framework defaults + sameSite cookies
- Field-level encryption implementation (nothing sensitive stored yet — see above)
- Key management (KMS), secret rotation
- Row-level security in Postgres (household scoping is app-layer in M1)
- Security headers/CSP tuning, dependency audit gates, intrusion detection
- Backups/DR, incident response process
- Any spec §8 items beyond the above (full §8 list unavailable — spec missing; this list is the
  honest reconstruction and errs toward listing more as deferred)

## Hard lines (enforced in code review and tests)

- No user is ever marked `VERIFIED` from self-entered data — M1 code cannot write that status.
- Mock surfaces are labeled MOCK in code and DEMO in UI.
- No compliance claims in code, UI, docs, or README.
