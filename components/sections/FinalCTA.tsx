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
      </div>

      <Reveal className="relative mx-auto max-w-4xl px-5 text-center sm:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-copper">
          Start today
        </p>

        <h2 className="mt-6 font-display text-4xl leading-tight tracking-tight sm:text-5xl lg:text-6xl">
          Your next backyard walk-through could end with a{" "}
          <span className="text-gradient-copper">signed deposit</span>
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted sm:text-xl">
          Design three backyards free. If Atelier doesn&apos;t pay for
          itself before the trial ends, you keep the renders anyway.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/builder">
              <Sparkles className="size-4" />
              Start free — 3 designs, no card
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <p className="mt-6 text-sm text-muted-2">
          Keyless to explore &middot; No card &middot; Three designs free
        </p>
      </Reveal>
    </section>
  );
}
