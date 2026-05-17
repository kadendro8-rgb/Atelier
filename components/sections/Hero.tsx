"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/CountUp";
import { BuilderMockup } from "@/components/BuilderMockup";

// Smooth easing for natural deceleration
const smoothEase = [0.22, 1, 0.36, 1];

const logos = [
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
    <section className="relative min-h-screen overflow-hidden pt-24 pb-16 sm:pt-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Eyebrow badge */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: smoothEase }}
            className="inline-flex items-center gap-2 rounded-full border border-border-bright bg-surface/80 px-4 py-2 text-sm backdrop-blur-sm"
          >
            <Sparkles className="size-4 text-copper" />
            <span className="text-muted">
              The design studio for outdoor-living contractors
            </span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 32 }}
            animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: smoothEase }}
            className="mt-8 font-display text-4xl leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl"
          >
            <span className="text-balance">Design the backyard</span>{" "}
            <span className="text-gradient-copper italic">before</span>
            <br />
            <span className="text-balance">you leave the driveway.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 32 }}
            animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: smoothEase }}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl"
          >
            Describe the patio, pool deck, or full backyard your client wants.
            Atelier returns a sited layout, photoreal renders, a line-item
            estimate, and a client portal that collects the deposit — before you
            pack up the truck.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 32 }}
            animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: smoothEase }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/builder">
                <Sparkles className="size-4" />
                Start free — 3 designs, no card
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto group">
              <Link href="/#how">
                See how it works
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>

          {/* Trust line */}
          <motion.p
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={reduceMotion ? {} : { opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: smoothEase }}
            className="mt-4 text-sm text-muted-2"
          >
            Open the builder now — no signup, no card. Your first three designs are free.
          </motion.p>
        </div>

        {/* Stats row */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 40 }}
          animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.45, ease: smoothEase }}
          className="mx-auto mt-16 max-w-4xl"
        >
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
            <div className="relative bg-surface px-6 py-8 text-center transition-colors duration-300 hover:bg-surface-2">
              <div className="font-display text-4xl tracking-tight text-foreground stat-value lg:text-5xl">
                <CountUp to={7} suffix=" min" />
              </div>
              <p className="mt-2 text-sm text-muted">
                From a backyard walk-through to a render the client can see
              </p>
            </div>
            <div className="relative bg-surface px-6 py-8 text-center transition-colors duration-300 hover:bg-surface-2">
              <div className="absolute left-0 top-1/2 hidden h-12 w-px -translate-y-1/2 bg-border sm:block" />
              <div className="font-display text-4xl tracking-tight text-foreground stat-value lg:text-5xl">
                $<CountUp to={2952} separator />
              </div>
              <p className="mt-2 text-sm text-muted">
                Typical deposit collected in-portal, same visit
              </p>
            </div>
            <div className="relative bg-surface px-6 py-8 text-center transition-colors duration-300 hover:bg-surface-2">
              <div className="absolute left-0 top-1/2 hidden h-12 w-px -translate-y-1/2 bg-border sm:block" />
              <div className="font-display text-4xl tracking-tight text-foreground stat-value lg:text-5xl">
                0.8<span className="text-copper">&times;</span>
              </div>
              <p className="mt-2 text-sm text-muted">
                More jobs won against a hand-drawn sketch
              </p>
            </div>
          </div>
        </motion.div>

        {/* Logo marquee */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={reduceMotion ? {} : { opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.55, ease: smoothEase }}
          className="mt-16"
        >
          <p className="mb-6 text-center text-xs uppercase tracking-[0.2em] text-muted-2">
            Trusted on the job site by
          </p>
          <div className="relative overflow-hidden">
            <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-ink to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-ink to-transparent" />
            <div className="flex animate-marquee items-center gap-12 will-change-transform">
              {[...logos, ...logos].map((name, i) => (
                <span
                  key={`${name}-${i}`}
                  className="flex items-center gap-2 whitespace-nowrap text-sm font-medium text-muted-2 transition-colors duration-200 hover:text-muted"
                >
                  <span className="size-1.5 rounded-full bg-copper/50" />
                  {name}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Hero product mockup */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 60 }}
          animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6, ease: smoothEase }}
          className="mt-16"
        >
          <BuilderMockup />
        </motion.div>
      </div>
    </section>
  );
}
