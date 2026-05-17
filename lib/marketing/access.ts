/**
 * Access control for the marketing studio (factory worker E2).
 *
 * The studio and its API are an internal operations tool, not a public
 * product surface. Access is gated to Atelier staff so the engine — and the
 * Anthropic spend behind it — is never exposed to the open internet.
 *
 * Keyless-safe: when Supabase auth is not configured (local dev) there are no
 * accounts to gate against, so access is open. Production always has Supabase
 * configured, so the gate is always enforced there.
 */
import { getSession } from "@/lib/auth";
import { hasSupabaseAuth } from "@/lib/env";
import type { ProfileRole } from "@/lib/db/types";

/** Roles permitted to operate the marketing studio. */
const OPERATOR_ROLES: ProfileRole[] = ["admin", "staff"];

/** The result of an access check. */
export type MarketingAccess =
  | { allowed: true }
  | { allowed: false; status: 401 | 403; reason: string };

/**
 * Resolve whether the current request may use the marketing engine.
 *
 * - 401 — not signed in.
 * - 403 — signed in, but not an Atelier staff/admin account.
 */
export async function checkMarketingAccess(): Promise<MarketingAccess> {
  if (!hasSupabaseAuth) return { allowed: true };

  const session = await getSession();
  if (!session) {
    return {
      allowed: false,
      status: 401,
      reason: "Sign in with an Atelier staff account to use the marketing studio.",
    };
  }

  const role = session.profile?.role;
  if (!role || !OPERATOR_ROLES.includes(role)) {
    return {
      allowed: false,
      status: 403,
      reason: "The marketing studio is limited to Atelier staff accounts.",
    };
  }

  return { allowed: true };
}
