/**
 * Zod-validated environment access.
 *
 * Every env var Atelier reads at runtime flows through here so callers get a
 * typed, validated value instead of `string | undefined`. All vars are
 * optional by design — the app degrades gracefully when Supabase / Anthropic
 * secrets are absent (see `getSupabaseAdmin`, the save-brief route, etc.) — but
 * when a var *is* present it is validated (non-empty, URL-shaped where
 * relevant). Validation failures throw eagerly so misconfiguration surfaces at
 * boot rather than as a confusing downstream error.
 */
import { z } from "zod";

const optionalUrl = z
  .string()
  .url("must be a valid URL")
  .optional();

const optionalSecret = z
  .string()
  .min(1, "must not be empty when set")
  .optional();

const envSchema = z.object({
  /** Supabase project URL (server-side preferred, public fallback). */
  SUPABASE_URL: optionalUrl,
  /** Public Supabase project URL (exposed to the browser). */
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  /** Service-role key — server only, bypasses RLS. Never expose. */
  SUPABASE_SERVICE_ROLE_KEY: optionalSecret,
  /** Anon/publishable key — safe for the browser, used for SSR auth. */
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalSecret,
  /** Anthropic API key — enables server-side brief parsing with Claude. */
  ANTHROPIC_API_KEY: optionalSecret,
  /** Stripe secret key — server only, authorises Checkout sessions. */
  STRIPE_SECRET_KEY: optionalSecret,
  /** Stripe webhook signing secret — verifies inbound webhook events. */
  STRIPE_WEBHOOK_SECRET: optionalSecret,
  /** Node environment, defaulted by Next.js / Node. */
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

/** Fully validated environment, as a typed object. */
export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse({
    SUPABASE_URL: process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NODE_ENV: process.env.NODE_ENV,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  return parsed.data;
}

/** The validated environment. Import this instead of touching `process.env`. */
export const env: Env = loadEnv();

/** Resolved Supabase project URL (server-side preferred, public fallback). */
export const supabaseUrl: string | undefined =
  env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;

/** True when the service-role Supabase client can be constructed. */
export const hasSupabaseAdmin: boolean = Boolean(
  supabaseUrl && env.SUPABASE_SERVICE_ROLE_KEY,
);

/** True when the cookie-based SSR Supabase client can be constructed. */
export const hasSupabaseAuth: boolean = Boolean(
  supabaseUrl && env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

/** True when Anthropic-backed brief parsing is configured. */
export const hasAnthropic: boolean = Boolean(env.ANTHROPIC_API_KEY);

/** True when Stripe Checkout can authorise a deposit payment. */
export const hasStripe: boolean = Boolean(env.STRIPE_SECRET_KEY);

/** True when inbound Stripe webhook signatures can be verified. */
export const hasStripeWebhook: boolean = Boolean(env.STRIPE_WEBHOOK_SECRET);
