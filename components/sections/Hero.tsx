"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/CountUp";
import { Marquee } from "@/components/Marquee";
import { HeroBuilderEntry } from "@/components/sections/HeroBuilderEntry";

const stats = [
  { to: 20, suffix: " min", label: "From a backyard walk-through to a render the client can see" },
  { to: 8500, prefix: "$", separator: true, label: "Typical deposit collected in-portal, same visit" },
  { to: 2.4, decimals: 1, suffix: "×", label: "More jobs won against a hand-drawn sketch" },
];

const marquee = [
  "Stoneline Hardscapes",
  "Cedar & Co. Outdoor Living",
  "Marlowe Landscape",
  "North Ridge Hardscape",
  "Atelier Verified Installers",
  "Bluewater Pools & Patios",
  "Fieldstone Paver Co.",
  "Province Outdoor Living",
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
            The design studio for outdoor-living contractors
          </motion.div>

          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 22 }}
            animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl"
          >
            Design the backyard{" "}
            <span className="text-copper">before you leave the driveway</span>.
          </motion.h1>

          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 22 }}
            animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg"
          >
            Describe the patio, pool deck, or full backyard your client
            wants. Atelier returns a sited layout, photoreal renders, a
            line-item estimate, and a client portal that collects the
            deposit — before you pack up the truck.
          </motion.p>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 22 }}
            animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="/#how">
                See how it works <ArrowRight className="size-4" />
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Stat count-up trio */}
        <div className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-surface px-6 py-7 text-center">
              <div className="font-display text-4xl tracking-tight text-foreground">
                <CountUp
                  to={s.to}
                  decimals={s.decimals ?? 0}
                  prefix={s.prefix}
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

      {/* Live builder entry — take the first real step right here */}
      <div className="mx-auto mt-10 max-w-4xl px-5 sm:px-8">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 40 }}
          animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <HeroBuilderEntry />
        </motion.div>
      </div>
    </section>
  );
}
