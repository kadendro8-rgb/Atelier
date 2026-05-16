"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/CountUp";
import { Marquee } from "@/components/Marquee";
import { HeroMockup } from "@/components/HeroMockup";

const stats = [
  { to: 9, suffix: " hrs", label: "Median time from first call to a permit-ready set" },
  { to: 24000, separator: true, suffix: "+", label: "Custom homes designed on Atelier" },
  { to: 3.1, decimals: 1, suffix: "×", label: "More proposals won against drafting-by-hand" },
];

const marquee = [
  "Hearthstone Builders",
  "Cedar & Co. Homes",
  "Marlowe Residential",
  "North Ridge Construction",
  "Atelier Verified Architects",
  "Bluewater Custom Homes",
  "Fieldstone Design-Build",
  "Province Homebuilders",
];

export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden pt-28 pb-10 sm:pt-36">
      {/* ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(210,138,85,0.16),transparent_70%)]"
      />
      <div aria-hidden="true" className="bg-grain pointer-events-none absolute inset-0 -z-10 opacity-60" />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-muted"
          >
            <Sparkles className="size-3.5 text-copper" />
            The design studio for custom-home builders
          </motion.div>

          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 22 }}
            animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl"
          >
            Design custom homes in an{" "}
            <span className="text-copper">afternoon</span>, not a quarter.
          </motion.h1>

          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 22 }}
            animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg"
          >
            Describe the home your client wants. Atelier returns floor plans,
            a sited parcel, photoreal renders, and a client portal that
            collects the deposit — before the consultation is over.
          </motion.p>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 22 }}
            animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/builder">
                Start designing free <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="/#how">See how it works</Link>
            </Button>
          </motion.div>
          <p className="mt-3 text-xs text-muted-2">
            No card required · 3 designs on the house · Cancel anytime
          </p>
        </div>

        {/* Stat count-up trio */}
        <div className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-surface px-6 py-7 text-center">
              <div className="font-display text-4xl tracking-tight text-foreground">
                <CountUp
                  to={s.to}
                  decimals={s.decimals ?? 0}
                  suffix={s.suffix}
                  separator={s.separator}
                />
              </div>
              <p className="mx-auto mt-2 max-w-[15rem] text-xs leading-relaxed text-muted">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Marquee */}
      <div className="mt-12">
        <p className="mb-1 text-center text-xs uppercase tracking-[0.2em] text-muted-2">
          Trusted on the job site by
        </p>
        <Marquee items={marquee} />
      </div>

      {/* Hero product visual */}
      <div className="mx-auto mt-10 max-w-6xl px-5 sm:px-8">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 40 }}
          animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <HeroMockup />
        </motion.div>
      </div>
    </section>
  );
}
