/**
 * Cookie-based session reading for the Next.js App Router.
 *
 * `getSession()` reads the Supabase auth cookies on the server, resolves the
 * authenticated user, and joins their `profiles` row. Use it from server
 * components, route handlers, and server actions.
 */
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseUrl, supabasePublishableKey, hasSupabaseAuth } from "@/lib/env";
import type { ProfileRow } from "@/lib/db/types";

/** The authenticated session: the auth user plus their profile row. */
export interface Session {
  user: {
    id: string;
    email: string | null;
  };
  profile: ProfileRow | null;
}

/**
 * Resolve the current session from request cookies.
 *
 * Returns null when Supabase auth is not configured, when there is no signed-in
 * user, or when the session is invalid. `profile` is null when the user has no
 * `profiles` row yet (e.g. immediately after sign-up).
 *
 * This is read-only: it never writes cookies, so it is safe to call from
 * server components.
 */
export async function getSession(): Promise<Session | null> {
  if (!hasSupabaseAuth || !supabaseUrl || !supabasePublishableKey) return null;

  const cookieStore = await cookies();

  const supabase = createServerClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        // Read-only context (server components cannot set cookies). Token
        // refresh writes are intentionally dropped; sign-in/refresh flows
        // should run in a route handler or middleware where setting is legal.
        setAll() {
          /* no-op: see comment above */
        },
      },
    },
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return {
    user: { id: user.id, email: user.email ?? null },
    profile: (profile as ProfileRow | null) ?? null,
  };
}
