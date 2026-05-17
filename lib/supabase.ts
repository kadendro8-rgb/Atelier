import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client built with the service-role key.
 *
 * Returns null when Supabase env vars are not configured (e.g. local dev
 * without secrets) so callers can degrade gracefully. The service-role key
 * bypasses row-level security and must never be exposed to the client — only
 * import this from server code (route handlers, server actions).
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
