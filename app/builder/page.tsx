import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Hammer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "The builder",
  description: "The Atelier design workspace — coming soon.",
};

export default function BuilderPage() {
  return (
    <main className="relative grid min-h-dvh place-items-center px-5 py-16 text-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_55%_at_50%_30%,rgba(210,138,85,0.14),transparent_70%)]"
      />
      <div className="max-w-lg">
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back home
        </Link>

        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-border-bright bg-surface text-copper">
          <Hammer className="size-6" />
        </div>

        <h1 className="mt-6 font-display text-4xl tracking-tight sm:text-5xl">
          The builder is under construction
        </h1>
        <p className="mx-auto mt-4 max-w-md text-muted">
          The Atelier design workspace — conversational floor plans, parcel
          fit, photoreal renders, and the client portal — is being framed out
          right now. Reserve your spot and we&apos;ll hand you the keys first.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/auth/signup">Join the early access list</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/">Explore the site</Link>
          </Button>
        </div>

        <div className="mt-12 flex items-center justify-center gap-2 text-xs text-muted-2">
          <Logo className="size-4 text-copper" />
          Atelier · preview build
        </div>
      </div>
    </main>
  );
}
