/**
 * Tiny analytics shim.
 *
 * PostHog (or any other product-analytics provider) is intentionally NOT a
 * dependency yet. `track` is a safe no-op in production and a debug log in
 * development, so call sites can be wired now and the real provider dropped in
 * later without touching every event.
 */

/** A flat bag of JSON-serialisable event properties. */
export type AnalyticsProps = Record<
  string,
  string | number | boolean | null | undefined
>;

/**
 * Record a product-analytics event. Currently a no-op (logs in development).
 * Never throws — analytics must never break a user flow.
 *
 * @param event Event name, e.g. `"address_selected"`.
 * @param props Optional flat property bag.
 */
export function track(event: string, props?: AnalyticsProps): void {
  try {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[analytics] ${event}`, props ?? {});
    }
    // Future: forward to PostHog / Segment / etc. here.
  } catch {
    /* analytics must never throw */
  }
}
