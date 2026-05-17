/**
 * Admin configuration dashboard.
 *
 * One screen that shows which integrations are live and exactly which
 * environment variables drive each one. It reads only on/off status — it
 * never displays or stores secret values; the keys themselves live in the
 * hosting provider's environment (e.g. Vercel → Environment Variables).
 *
 * Access: once Supabase auth is configured the page requires a signed-in
 * user. Before that — the initial bootstrap — it is open so the operator can
 * see what still needs wiring.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CircleCheck, CircleDashed, KeyRound } from "lucide-react";
import { Logo } from "@/components/Logo";
import { getSession } from "@/lib/auth";
import {
  hasAnthropic,
  hasStripe,
  hasStripeWebhook,
  hasSupabaseAdmin,
  hasSupabaseAuth,
} from "@/lib/env";

export const metadata: Metadata = {
  title: "Configuration · Atelier",
  robots: { index: false },
};

// Always reflect the current environment rather than a build-time snapshot.
export const dynamic = "force-dynamic";

type Integration = {
  name: string;
  on: boolean;
  detail: string;
  /** Environment variables that enable this integration. */
  vars: string[];
  /** What the product does while this integration is off. */
  fallback: string;
};

function integrations(): Integration[] {
  return [
    {
      name: "AI brief parsing",
      on: hasAnthropic,
      detail: "Parses the plain-language design brief with Claude.",
      vars: ["ANTHROPIC_API_KEY"],
      fallback: "Falls back to the on-device keyword parser.",
    },
    {
      name: "Database",
      on: hasSupabaseAdmin,
      detail: "Persists projects, floor plans and leads in Supabase.",
      vars: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
      fallback: "Data stays in the browser only; nothing is saved server-side.",
    },
    {
      name: "Accounts",
      on: hasSupabaseAuth,
      detail: "Enables client and builder sign-in / sign-up.",
      vars: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
      fallback: "The builder is open to everyone with no account.",
    },
    {
      name: "Deposit payments",
      on: hasStripe,
      detail: "Lets the client portal collect a deposit via Stripe Checkout.",
      vars: ["STRIPE_SECRET_KEY"],
      fallback: "The portal runs a non-charging demo flow.",
    },
    {
      name: "Payment confirmation",
      on: hasStripeWebhook,
      detail: "Verifies Stripe webhooks so a paid deposit funds the project.",
      vars: ["STRIPE_WEBHOOK_SECRET"],
      fallback: "Payments cannot be confirmed; projects stay unfunded.",
    },
  ];
}

export default async function AdminPage() {
  // Once auth exists, lock the page down. Before that, leave it open so the
  // operator can read the setup checklist during the initial bootstrap.
  if (hasSupabaseAuth) {
    const session = await getSession();
    if (!session) redirect("/login");
  }

  const items = integrations();
  const connected = items.filter((i) => i.on).length;

  return (
    <div className="min-h-dvh bg-ink">
      <header className="sticky top-0 z-40 border-b border-border bg-ink/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2"
            aria-label="Atelier home"
          >
            <Logo className="size-6 text-copper" />
            <span className="hidden font-display text-base tracking-tight sm:inline">
              Atelier
            </span>
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted">
            <KeyRound className="size-3.5 text-copper" />
            Configuration
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
          Integrations
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {connected} of {items.length} integrations connected. Atelier runs
          with any combination — each unconfigured integration simply degrades
          to a fallback.
        </p>

        <ul className="mt-8 grid gap-3">
          {items.map((item) => (
            <li
              key={item.name}
              className="rounded-card border border-border bg-surface p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg tracking-tight">
                    {item.name}
                  </h2>
                  <p className="mt-0.5 text-sm text-muted">{item.detail}</p>
                </div>
                <span
                  className={
                    item.on
                      ? "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-sage/40 bg-sage/10 px-2.5 py-1 text-[11px] font-medium text-sage"
                      : "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border-bright bg-surface-3 px-2.5 py-1 text-[11px] font-medium text-muted"
                  }
                >
                  {item.on ? (
                    <>
                      <CircleCheck className="size-3.5" />
                      Connected
                    </>
                  ) : (
                    <>
                      <CircleDashed className="size-3.5" />
                      Not configured
                    </>
                  )}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {item.vars.map((v) => (
                  <code
                    key={v}
                    className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-copper-bright"
                  >
                    {v}
                  </code>
                ))}
              </div>

              {!item.on && (
                <p className="mt-2 text-xs text-muted-2">{item.fallback}</p>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-8 rounded-card border border-border bg-surface p-5">
          <h2 className="font-display text-base tracking-tight">
            How to connect an integration
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            These keys are read from the hosting environment — they are never
            entered or stored in the app. Set the variables above in your host
            (on Vercel: <span className="text-foreground">Project →
            Settings → Environment Variables</span>), then redeploy. The
            integration turns on automatically — no code change needed.
          </p>
          <p className="mt-2 text-xs text-muted-2">
            Stripe and Supabase need a little dashboard setup too — see the
            project README for the step-by-step.
          </p>
        </div>
      </main>
    </div>
  );
}
