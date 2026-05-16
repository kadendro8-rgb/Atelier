const secret = process.env.CLERK_SECRET_KEY ?? "";
const publishable = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

/**
 * Authentication (Clerk) is enabled only when BOTH keys are present and
 * actually look like Clerk keys (`sk_…` / `pk_…`). A missing, swapped,
 * or wrong-service key (e.g. an Anthropic `sk-ant-…` key) leaves auth
 * cleanly disabled instead of crashing the app.
 *
 * Server-only: `CLERK_SECRET_KEY` is not exposed to the browser, so this
 * value is correct only in server components, route handlers, and
 * middleware. Pass it to client components as a prop.
 */
export const authEnabled =
  secret.startsWith("sk_") && publishable.startsWith("pk_");
