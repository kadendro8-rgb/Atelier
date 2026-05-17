/**
 * Auth callback — exchanges an OAuth/email-confirmation `code` for a session.
 *
 * Supabase email-confirmation links (and any future OAuth flows) land here with
 * a `?code=` query param. We exchange it for a session — which sets the auth
 * cookies on the response — then redirect into the builder.
 *
 * Keyless-safe: with no Supabase env vars the route simply redirects home.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env, supabaseUrl, hasSupabaseAuth } from "@/lib/env";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // DECISION: no code, or Supabase not configured → nothing to exchange.
  // Send the visitor somewhere sensible instead of erroring.
  if (
    !code ||
    !hasSupabaseAuth ||
    !supabaseUrl ||
    !env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.redirect(`${origin}/login`);
  }

  // The response carries the redirect *and* the cookies the exchange sets.
  const response = NextResponse.redirect(`${origin}/builder`);

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

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  return response;
}
