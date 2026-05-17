/**
 * Supabase SSR session-refresh middleware.
 *
 * On every matched request this refreshes the Supabase auth cookie (rotating
 * the access token before it expires) so server components reading the session
 * always see a valid user. It is the standard `@supabase/ssr` middleware.
 *
 * Keyless-safe: when the Supabase env vars are absent it passes the request
 * through untouched, so the site still builds and runs without secrets.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseUrl, supabasePublishableKey, hasSupabaseAuth } from "@/lib/env";

export async function middleware(request: NextRequest) {
  // DECISION: no-op when Supabase auth isn't configured — the app is designed
  // to run keyless, so the middleware must not touch the response in that case.
  if (!hasSupabaseAuth || !supabaseUrl || !supabasePublishableKey) {
    return NextResponse.next();
  }

  // The response we'll return — cookie writes are mirrored onto it.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // IMPORTANT: `getUser()` triggers the token refresh + cookie rotation.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  /**
   * Run on every path except Next.js internals and static assets — those
   * never carry auth cookies, so refreshing on them is wasted work.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
