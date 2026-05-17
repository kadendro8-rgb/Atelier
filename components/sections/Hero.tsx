"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/CountUp";
import { HeroMockup } from "@/components/HeroMockup";

const stats = [
  { to: 9, suffix: " hrs", label: "Median time to permit-ready" },
  { to: 24000, separator: true, suffix: "+", label: "Custom homes designed" },
  { to: 3.1, decimals: 1, suffix: "x", label: "More proposals won" },
];

const logos = [
  "Hearthstone Builders",
  "Cedar & Co.",
  "Marlowe Residential",
  "North Ridge",
  "Bluewater Homes",
  "Fieldstone Design",
];

export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative min-h-screen overflow-hidden pt-24 pb-16 sm:pt-32">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {/* Main gradient orb */}
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-0 h-[800px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-copper/10 blur-[120px]"
        />
        {/* Secondary accent */}
        <div
          aria-hidden="true"
          className="absolute right-0 top-1/3 h-[400px] w-[400px] rounded-full bg-copper/5 blur-[80px]"
        />
        {/* Grid pattern */}
        <div className="bg-grid absolute inset-0 opacity-30" />
        {/* Fade out grid at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-ink to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Eyebrow badge */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 rounded-full border border-border-bright bg-surface/80 px-4 py-2 text-sm backdrop-blur-sm"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-copper opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-copper" />
            </span>
            <span className="text-muted">
              Trusted by <span className="text-foreground font-medium">2,400+</span> builders nationwide
            </span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 30 }}
            animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 font-display text-4xl leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl"
          >
            <span className="text-balance">Design custom homes in an</span>{" "}
            <span className="text-gradient-copper">afternoon</span>
            <span className="text-balance">, not a quarter</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 30 }}
            animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl"
          >
            Turn client conversations into permit-ready designs. Floor plans, 
            site fits, photoreal renders, and collected deposits — all before 
            the consultation ends.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 30 }}
            animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/builder">
                Start designing free
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto group">
              <Link href="/#how">
                <span className="flex items-center justify-center size-6 rounded-full bg-surface-3 group-hover:bg-copper/20 transition-colors mr-1">
                  <Play className="size-3 fill-current" />
                </span>
                Watch demo
              </Link>
            </Button>
          </motion.div>

          {/* Trust line */}
          <motion.p
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={reduceMotion ? {} : { opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-4 text-sm text-muted-2"
          >
            No card required &middot; 3 free designs &middot; Cancel anytime
          </motion.p>
        </div>

        {/* Stats row */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 40 }}
          animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-16 max-w-4xl"
        >
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className="relative bg-surface px-6 py-8 text-center transition-colors hover:bg-surface-2"
              >
                {i > 0 && (
                  <div className="absolute left-0 top-1/2 hidden h-12 w-px -translate-y-1/2 bg-border sm:block" />
                )}
                <div className="font-display text-4xl tracking-tight text-foreground stat-value lg:text-5xl">
                  <CountUp
                    to={s.to}
                    decimals={s.decimals ?? 0}
                    suffix={s.suffix}
                    separator={s.separator}
                  />
                </div>
                <p className="mt-2 text-sm text-muted">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Logo marquee */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={reduceMotion ? {} : { opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16"
        >
          <p className="mb-6 text-center text-xs uppercase tracking-[0.2em] text-muted-2">
            Trusted by leading builders
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {logos.map((name) => (
              <span
                key={name}
                className="text-sm font-medium text-muted-2 transition-colors hover:text-muted"
              >
                {name}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Hero product mockup */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 60 }}
          animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16"
        >
          <div className="relative">
            {/* Glow behind mockup */}
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 translate-y-8 rounded-3xl bg-copper/20 blur-3xl"
            />
            <HeroMockup />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
