import Stripe from "stripe";

/**
 * Server-side Stripe client.
 *
 * Returns null when `STRIPE_SECRET_KEY` is not configured so callers can
 * degrade gracefully — the portal then falls back to its priced demo flow
 * instead of taking a real payment. The secret key must never reach the
 * browser; only import this from server code (route handlers, server actions).
 *
 * The eventual operator drops in their own Stripe key via the environment;
 * nothing here is tied to a specific account.
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}
