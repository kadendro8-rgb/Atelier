/**
 * Browser-side Supabase client for the Next.js App Router.
 *
 * `getSupabaseBrowser()` builds a cookie-aware client via `createBrowserClient`
 * from `@supabase/ssr`, using only the public (`NEXT_PUBLIC_SUPABASE_*`) env
 * vars so it is safe to ship to the browser. The auth cookies it writes are
 * the same ones `getSession()` and the SSR middleware read on the server.
 *
 * Returns null when Supabase auth is not configured, so client components can
 * degrade gracefully (see `app/login/page.tsx`).
 */
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { env, supabaseUrl, hasSupabaseAuth } from "@/lib/env";

/**
 * Construct (lazily) the browser Supabase client.
 *
 * Returns null when the public Supabase env vars are absent so the keyless
 * build still works — callers must handle the null case.
 */
export function getSupabaseBrowser(): SupabaseClient | null {
  // DECISION: `hasSupabaseAuth` already proves both `supabaseUrl` and the anon
  // key are present, but TypeScript can't narrow across the boolean — re-check
  // the two values directly so no non-null assertions are needed.
  if (!hasSupabaseAuth || !supabaseUrl || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  return createBrowserClient(
    supabaseUrl,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
