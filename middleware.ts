import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import {
  NextResponse,
  type NextFetchEvent,
  type NextMiddleware,
  type NextRequest,
} from "next/server";
import { authEnabled } from "@/lib/auth";

const isProtectedRoute = createRouteMatcher(["/builder(.*)"]);

// Built once, only when Clerk keys are configured and well-formed.
// Construction is guarded so a misconfigured key can never break the module.
let clerk: NextMiddleware | null = null;
if (authEnabled) {
  try {
    clerk = clerkMiddleware(async (auth, req) => {
      if (isProtectedRoute(req)) {
        await auth.protect({
          unauthenticatedUrl: new URL("/auth/signin", req.url).toString(),
        });
      }
    });
  } catch (err) {
    console.error("Clerk middleware init failed — auth disabled:", err);
    clerk = null;
  }
}

export default async function middleware(
  req: NextRequest,
  event: NextFetchEvent,
) {
  if (!clerk) return NextResponse.next();
  try {
    return await clerk(req, event);
  } catch (err) {
    // A bad key or Clerk outage must never 500 the whole site — fall
    // through with auth disabled instead.
    console.error("Clerk middleware failed — continuing without auth:", err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    // Clerk frontend API routes
    "/__clerk/(.*)",
  ],
};
