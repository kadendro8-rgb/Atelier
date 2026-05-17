"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Images, Layers, Ruler, Squircle, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import {
  GALLERY_BUDGETS,
  GALLERY_PROJECTS,
  GALLERY_REGIONS,
  GALLERY_STYLES,
  type GalleryProject,
} from "@/lib/network-mock";

type Filters = {
  style: string | null;
  region: string | null;
  budget: string | null;
};

const EMPTY: Filters = { style: null, region: null, budget: null };

export default function GalleryPage() {
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const reduce = useReducedMotion();

  const projects = useMemo(
    () =>
      GALLERY_PROJECTS.filter(
        (p) =>
          (!filters.style || p.style === filters.style) &&
          (!filters.region || p.region === filters.region) &&
          (!filters.budget || p.budget === filters.budget),
      ),
    [filters],
  );

  const active = filters.style || filters.region || filters.budget;

  function toggle<K extends keyof Filters>(key: K, value: string) {
    setFilters((f) => ({ ...f, [key]: f[key] === value ? null : value }));
  }

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
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
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
            <Images className="size-3.5 text-copper" />
            Design gallery
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <motion.div {...reveal}>
          <p className="text-xs uppercase tracking-wide text-muted-2">
            v2.0 · Section 7.3
          </p>
          <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
            The design gallery
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Real backyards designed in Atelier, approved and installed — shared
            with the contractor&apos;s permission. Filter by style, region, and
            budget to find a starting point.
          </p>
        </motion.div>

        <div className="mt-8 space-y-3">
          <FilterRow
            label="Style"
            options={GALLERY_STYLES}
            value={filters.style}
            onToggle={(v) => toggle("style", v)}
          />
          <FilterRow
            label="Region"
            options={GALLERY_REGIONS}
            value={filters.region}
            onToggle={(v) => toggle("region", v)}
          />
          <FilterRow
            label="Budget"
            options={GALLERY_BUDGETS}
            value={filters.budget}
            onToggle={(v) => toggle("budget", v)}
          />
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {projects.length}{" "}
            {projects.length === 1 ? "project" : "projects"}
          </p>
          {active && (
            <button
              type="button"
              onClick={() => setFilters(EMPTY)}
              className="inline-flex items-center gap-1.5 text-xs text-muted-2 transition-colors hover:text-foreground"
            >
              <X className="size-3.5" />
              Clear filters
            </button>
          )}
        </div>

        {projects.length > 0 ? (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, i) => (
              <GalleryCard
                key={project.id}
                project={project}
                index={i}
                reduce={Boolean(reduce)}
              />
            ))}
          </ul>
        ) : (
          <p className="mt-8 rounded-card border border-dashed border-border bg-surface p-10 text-center text-sm text-muted">
            No projects match those filters yet. Try clearing one.
          </p>
        )}
      </main>
    </div>
  );
}

function FilterRow({
  label,
  options,
  value,
  onToggle,
}: {
  label: string;
  options: string[];
  value: string | null;
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-14 shrink-0 text-[10px] uppercase tracking-wide text-muted-2">
        {label}
      </span>
      {options.map((opt) => {
        const on = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            aria-pressed={on}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              on
                ? "border-copper bg-copper text-ink"
                : "border-border bg-surface-2 text-muted hover:border-copper hover:text-copper-bright",
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function GalleryCard({
  project,
  index,
  reduce,
}: {
  project: GalleryProject;
  index: number;
  reduce: boolean;
}) {
  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.04 }}
      className="group overflow-hidden rounded-card border border-border bg-surface transition-colors hover:border-border-bright"
    >
      <div
        className="relative aspect-[4/3] w-full"
        style={{
          background: `linear-gradient(135deg, ${project.swatch[0]}, ${project.swatch[1]})`,
        }}
      >
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(rgba(11,10,9,0.35) 1px,transparent 1px),linear-gradient(90deg,rgba(11,10,9,0.35) 1px,transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <span className="absolute left-3 top-3 rounded-full border border-border bg-ink/80 px-2.5 py-1 text-[10px] font-medium text-foreground backdrop-blur">
          {project.style}
        </span>
        <span className="absolute right-3 top-3 rounded-full border border-border bg-ink/80 px-2.5 py-1 text-[10px] text-muted backdrop-blur">
          {project.region}
        </span>
      </div>

      <div className="p-5">
        <h3 className="font-display text-lg tracking-tight">
          {project.title}
        </h3>
        <p className="mt-0.5 text-xs text-muted-2">
          Installed by {project.contractor}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Ruler className="size-3.5 text-copper" />
            {project.sqft.toLocaleString("en-US")} sf
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Layers className="size-3.5 text-copper" />
            {project.zones} {project.zones === 1 ? "zone" : "zones"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Squircle className="size-3.5 text-copper" />
            {project.material}
          </span>
        </div>

        <div className="mt-4 border-t border-border pt-3">
          <span className="text-[10px] uppercase tracking-wide text-muted-2">
            Budget
          </span>
          <p className="text-sm font-medium text-copper-bright">
            {project.budget}
          </p>
        </div>
      </div>
    </motion.li>
  );
}
