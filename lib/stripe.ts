/**
 * Lazy server-side Stripe client.
 *
 * Atelier degrades gracefully when payment secrets are absent (local dev,
 * preview deploys without keys). `getStripe()` constructs a `Stripe` client
 * only when `STRIPE_SECRET_KEY` is present and returns `null` otherwise, so
 * route handlers can respond with a clean error instead of a 500.
 *
 * DECISION: `infra/stripe.ts` constructs its client eagerly at module load
 * with `STRIPE_SECRET_KEY || ''`, which never yields `null` and would silently
 * carry an empty key. The task requires a lazily-constructed, key-absent-safe
 * client, so this module is added rather than reusing `infra/stripe.ts`.
 *
 * Server-only — never import from client components.
 */
import Stripe from "stripe";

/** Memoised client; keyed on the secret so a changed key rebuilds it. */
let cached: { key: string; client: Stripe } | null = null;

/**
 * Return a configured Stripe client, or `null` when `STRIPE_SECRET_KEY` is
 * not set. The client is constructed lazily and memoised across calls.
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;

  if (cached && cached.key === key) return cached.client;

  // Omit `apiVersion` so the SDK uses the version it ships pinned to,
  // keeping this decoupled from a hard-coded version string.
  const client = new Stripe(key);
  cached = { key, client };
  return client;
}

/** True when the server Stripe client can be constructed. */
export function hasStripe(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
