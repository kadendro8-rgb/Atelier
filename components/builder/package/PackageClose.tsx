"use client";

/**
 * PackageClose — the deliberate emotional close of the builder demo.
 *
 * The visitor has just run lot → brief → layout → package keylessly and is
 * looking at a finished, client-ready deliverable. This is the peak of the
 * experience, so this is where the one honest conversion ask belongs.
 *
 * It is *never* a gate. Everything above it — the three-lens package, the
 * exports, the deposit close — works without an account. This panel simply
 * gives the obvious next action a name: create a free account to *keep* what
 * was just built — save the project, send the client portal, start the next
 * design. The trial it points at is the existing keyless offer (three designs
 * free, no card), made visible rather than implied.
 *
 * Account creation routes to `/login`, the Supabase-backed auth page, which
 * already degrades gracefully to a calm notice when auth isn't configured —
 * so this close is safe in a fully keyless environment too.
 */
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  FolderHeart,
  PencilRuler,
  Send,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import type { ProjectType } from "@/lib/db/types";

const EASE = [0.16, 1, 0.3, 1] as const;

/* The project type re-frames the "design another" link so a fresh run opens
   in the same flow the visitor just finished. */

/** The three benefit-framed reasons to create an account — save / send / keep. */
const REASONS = [
  {
    icon: FolderHeart,
    title: "Save this project",
    body: "Keep the layout, renders, and estimate together — yours to reopen and refine anytime.",
  },
  {
    icon: Send,
    title: "Send the client portal",
    body: "Share a branded portal where the client reviews the design and approves the deposit.",
  },
  {
    icon: PencilRuler,
    title: "Start the next design",
    body: "Your first three designs are free — no card. Pick up the next backyard the same day.",
  },
] as const;

export function PackageClose({
  projectType,
}: {
  projectType: ProjectType;
}) {
  const reduce = useReducedMotion();

  // A fresh builder run for the "design another" path — same project type,
  // no carried-over projectId so the new run starts clean at the lot step.
  const nextDesignHref = `/builder?type=${encodeURIComponent(projectType)}`;

  const reveal = reduce
    ? {}
    : ({
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.4 },
        transition: { duration: 0.6, ease: EASE },
      } as const);

  return (
    <motion.section
      {...reveal}
      aria-labelledby="package-close-heading"
      className="relative mt-12 overflow-hidden rounded-card border border-border-bright bg-surface"
    >
      {/* A soft copper wash anchors this as the finish, not another band. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(210,138,85,0.16),transparent_75%)]"
      />

      <div className="relative px-6 py-9 sm:px-10 sm:py-11">
        <div className="mx-auto max-w-xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs text-muted">
            <Sparkles className="size-3.5 text-copper" />
            That&apos;s the deliverable
          </span>
          <h2
            id="package-close-heading"
            className="mt-4 font-display text-2xl tracking-tight sm:text-3xl"
          >
            Keep this — and the next one.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
            You just ran a full project, start to finish, with no signup. Create
            a free account to save this design, send the client portal, and
            start the next one — three designs free, no card.
          </p>
        </div>

        <ul className="mx-auto mt-8 grid max-w-3xl gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-3">
          {REASONS.map((r) => {
            const Icon = r.icon;
            return (
              <li key={r.title} className="bg-surface-2 p-5">
                <span className="grid size-9 place-items-center rounded-full bg-copper/15 text-copper">
                  <Icon className="size-4" />
                </span>
                <p className="mt-3 text-sm font-medium text-foreground">
                  {r.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-2">
                  {r.body}
                </p>
              </li>
            );
          })}
        </ul>

        <div className="mx-auto mt-8 flex max-w-md flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link
              href="/login"
              onClick={() =>
                track("package_close_create_account", { projectType })
              }
            >
              <Sparkles className="size-4" />
              Create your free account
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Link
              href={nextDesignHref}
              onClick={() =>
                track("package_close_design_another", { projectType })
              }
            >
              Design another
            </Link>
          </Button>
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-2">
          The builder stays open without an account — saving and the client
          portal are what an account adds.
        </p>
      </div>
    </motion.section>
  );
}
