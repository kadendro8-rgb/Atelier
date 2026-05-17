"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  CircleCheckBig,
  Ruler,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  REVIEW_QUEUE,
  formatUsd,
  type ReviewProject,
  type ReviewStatus,
} from "@/lib/network-mock";

const FILTERS: { key: ReviewStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "in-review", label: "In review" },
  { key: "ready", label: "Ready to approve" },
];

const STATUS_STYLES: Record<ReviewStatus, { label: string; cls: string }> = {
  new: { label: "New", cls: "border-copper/40 bg-copper/10 text-copper-bright" },
  "in-review": {
    label: "In review",
    cls: "border-border-bright bg-surface-3 text-muted",
  },
  ready: {
    label: "Ready to approve",
    cls: "border-sage/40 bg-sage/10 text-sage",
  },
};

export default function PartnerDashboardPage() {
  const [filter, setFilter] = useState<ReviewStatus | "all">("all");
  const reduce = useReducedMotion();

  const queue = useMemo(
    () =>
      filter === "all"
        ? REVIEW_QUEUE
        : REVIEW_QUEUE.filter((p) => p.status === filter),
    [filter],
  );

  const stats = useMemo(() => {
    const pipeline = REVIEW_QUEUE.reduce((sum, p) => sum + p.reviewFee, 0);
    const ready = REVIEW_QUEUE.filter((p) => p.status === "ready").length;
    const sqft = REVIEW_QUEUE.reduce((sum, p) => sum + p.sqft, 0);
    return { pipeline, ready, sqft, total: REVIEW_QUEUE.length };
  }, []);

  const reveal = reduce
    ? {}
    : ({
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease: "easeOut" },
      } as const);

  return (
    <div className="min-h-dvh bg-ink">
      <header className="sticky top-0 z-40 border-b border-border bg-ink/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
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
            <ShieldCheck className="size-3.5 text-copper" />
            Review partner
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <motion.div {...reveal}>
          <p className="text-xs uppercase tracking-wide text-muted-2">
            v2.0 · Section 7.1
          </p>
          <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
            Welcome back, Dana
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Review incoming backyard designs, sign off on the layouts and
            material specs, and get paid via Stripe Connect. You keep 80% of
            every review fee — Atelier&apos;s cut is 20%.
          </p>
        </motion.div>

        <motion.div
          {...reveal}
          className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          <StatCard
            icon={<ClipboardCheck className="size-4 text-copper" />}
            label="In queue"
            value={String(stats.total)}
          />
          <StatCard
            icon={<CheckCircle2 className="size-4 text-sage" />}
            label="Ready to approve"
            value={String(stats.ready)}
          />
          <StatCard
            icon={<Wallet className="size-4 text-copper" />}
            label="Pipeline (your share)"
            value={formatUsd(stats.pipeline)}
          />
          <StatCard
            icon={<Ruler className="size-4 text-copper" />}
            label="Total sq ft"
            value={stats.sqft.toLocaleString("en-US")}
          />
        </motion.div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl tracking-tight">
            Project queue
          </h2>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const on = filter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  aria-pressed={on}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    on
                      ? "border-copper bg-copper text-ink"
                      : "border-border bg-surface-2 text-muted hover:border-copper hover:text-copper-bright",
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {queue.map((project, i) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={i}
              reduce={Boolean(reduce)}
            />
          ))}
        </ul>

        {queue.length === 0 && (
          <p className="mt-8 rounded-card border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
            No projects in this status right now.
          </p>
        )}
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-muted-2">
        {icon}
        {label}
      </div>
      <p className="mt-2 font-display text-2xl tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

function ProjectCard({
  project,
  index,
  reduce,
}: {
  project: ReviewProject;
  index: number;
  reduce: boolean;
}) {
  const status = STATUS_STYLES[project.status];
  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.05 }}
      className="flex flex-col rounded-card border border-border bg-surface p-5 transition-colors hover:border-border-bright"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-2">
            {project.contractor}
          </p>
          <h3 className="mt-0.5 font-display text-lg tracking-tight">
            {project.project}
          </h3>
          <p className="mt-0.5 text-xs text-muted">{project.location}</p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium",
            status.cls,
          )}
        >
          {status.label}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-border bg-border">
        <Fact
          label="Size"
          value={`${project.sqft.toLocaleString("en-US")} sf`}
        />
        <Fact label="Your fee" value={formatUsd(project.reviewFee)} />
        <Fact label="Project" value={project.id} />
      </dl>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted">
          <CalendarClock className="size-3.5 text-copper" />
          Due {project.deadline}
        </span>
        <Button
          size="sm"
          variant={project.status === "ready" ? "primary" : "subtle"}
        >
          {project.status === "ready" ? (
            <>
              <CircleCheckBig className="size-4" /> Approve
            </>
          ) : (
            <>
              Review <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </div>
    </motion.li>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface p-2.5">
      <dt className="text-[10px] uppercase tracking-wide text-muted-2">
        {label}
      </dt>
      <dd className="mt-0.5 text-xs font-medium text-foreground">{value}</dd>
    </div>
  );
}
