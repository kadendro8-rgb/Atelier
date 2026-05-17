"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Reveal";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden border-t border-border py-32 lg:py-40">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-copper/15 blur-[120px]"
        />
        <div className="bg-grid absolute inset-0 opacity-20" />
      </div>

      <Reveal className="relative mx-auto max-w-4xl px-5 text-center sm:px-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-copper/30 bg-copper/10 px-4 py-2 text-sm">
          <Sparkles className="size-4 text-copper" />
          <span className="text-copper-bright">Start designing today</span>
        </div>

        <h2 className="mt-8 font-display text-4xl leading-tight tracking-tight sm:text-5xl lg:text-6xl">
          Your next client meeting could end with a{" "}
          <span className="text-gradient-copper">signed deposit</span>
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted sm:text-xl">
          Design three custom homes free. If Atelier doesn&apos;t pay for
          itself before the trial ends, you walk away with the plans anyway.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="xl">
            <Link href="/builder">
              Design your first home
              <ArrowRight className="size-5" />
            </Link>
          </Button>
          <Button asChild size="xl" variant="outline">
            <Link href="/#pricing">View pricing</Link>
          </Button>
        </div>

        <p className="mt-6 text-sm text-muted-2">
          No credit card required &middot; Set up in under 2 minutes &middot; Cancel anytime
        </p>
      </Reveal>
    </section>
  );
}
