/**
 * `/marketing` — the marketing studio route.
 *
 * A server component that gates access before the (client) studio renders.
 * The studio is an internal tool for factory worker E2, restricted to Atelier
 * staff; see `lib/marketing/access.ts`.
 */
import Link from "next/link";
import { Lock } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { checkMarketingAccess } from "@/lib/marketing/access";
import { MarketingStudio } from "./MarketingStudio";

// The access gate must run on every request — never serve a prerendered
// (ungated) copy of the studio.
export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  const access = await checkMarketingAccess();
  if (access.allowed) return <MarketingStudio />;

  return (
    <div className="flex min-h-dvh flex-col bg-ink bg-grain">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2"
            aria-label="Atelier home"
          >
            <Logo className="size-6 text-copper" />
            <span className="font-display text-base tracking-tight">
              Atelier
            </span>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-card border border-border bg-surface p-8 text-center">
          <span className="mx-auto flex size-11 items-center justify-center rounded-full border border-border bg-surface-2">
            <Lock className="size-5 text-copper" />
          </span>
          <h1 className="mt-4 font-display text-xl tracking-tight">
            Marketing studio
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {access.reason}
          </p>
          {access.status === 401 && (
            <Button asChild className="mt-6">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
