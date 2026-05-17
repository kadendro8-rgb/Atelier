/**
 * Sign out — clears the Supabase session and returns home.
 *
 * POST-only: sign-out is a state change, so it must not be triggerable by a
 * plain navigation or prefetch. `signOut()` clears the auth cookies on the
 * response before the redirect.
 *
 * Keyless-safe: with no Supabase env vars it just redirects home.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env, supabaseUrl, hasSupabaseAuth } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { origin } = new URL(request.url);
  const response = NextResponse.redirect(`${origin}/`, { status: 303 });

  if (
    !hasSupabaseAuth ||
    !supabaseUrl ||
    !env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  await supabase.auth.signOut();

  return response;
}
