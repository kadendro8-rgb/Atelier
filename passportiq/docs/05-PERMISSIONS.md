# 05 — Permissions (Milestone 1 RBAC)

## Roles

| Role | Stored | M1 capability |
|---|---|---|
| `OWNER` | `household_members.role` | Full read/write within their household |
| `HOUSEHOLD_MEMBER` | `household_members.role` | Read-only within their household (no M1 UI writes exist anyway; enforced in module layer) |
| `admin` | `users.isAdmin` | Internal/support; **no admin UI in M1** — flag exists, does nothing yet |

## Enforcement points

1. **Session → user**: `identity.requireSession()` in every authenticated page/action.
2. **User → household**: `identity.requireMembership(userId, householdId)` returns the membership
   row (with role) or throws. Every module function that touches domain data takes a
   `householdId` and is called only after this check.
3. **Role → action**: mutating module functions assert `role === 'OWNER'` (M2 CRUD will use this;
   M1's only mutations are auth + seed).

## Shape chosen so ABAC can be added later

`household_members` is already a subject–resource join with a role column. Adding ABAC later means:
- add `attributes JSONB` to the membership row (e.g. per-section grants, expiry), and/or
- introduce a `grants` table (`subjectId`, `resourceType`, `resourceId`, `action`, `conditions`).

Because all checks flow through two functions (`requireSession`, `requireMembership`), swapping the
decision logic does not touch call sites. That is the entire M1 design bet: **centralize the check,
keep the table a join**, defer the policy engine.

## Explicitly not in M1

Invitations, member management UI, per-section permissions, share-grant tokens (M3 stub),
admin console, impersonation (never without audit).
