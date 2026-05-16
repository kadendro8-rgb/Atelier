/**
 * Authentication is powered by Clerk and activates only when its keys are
 * present. Without them the site runs with auth disabled — the builder
 * stays open and the /auth pages show a non-functional preview form.
 *
 * Server-only: `CLERK_SECRET_KEY` is not exposed to the browser, so this
 * value is correct only in server components, route handlers, and
 * middleware. Pass it to client components as a prop.
 */
export const authEnabled =
  Boolean(process.env.CLERK_SECRET_KEY) &&
  Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
