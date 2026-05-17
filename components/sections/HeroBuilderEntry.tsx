"use client";

/**
 * Live builder entry widget for the marketing hero.
 *
 * Instead of a static screenshot, the visitor takes a real first builder
 * action right here: pick what they're building (the exact `PROJECT_TYPES`
 * registry the builder uses) and, optionally, name the lot. The choice is
 * threaded into `/builder?type=…` so the studio opens already mid-flow — the
 * lot step reads the query param and never re-asks.
 *
 * Keyless and offline-safe: this is pure client state plus a route push.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, MapPin, Search } from "lucide-react";
import { PROJECT_TYPES } from "@/lib/project-types";
import type { ProjectType } from "@/lib/db/types";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/** localStorage key shared with the lot step's persisted project-type choice. */
const PROJECT_TYPE_KEY = "atelier:projectType";

export function HeroBuilderEntry() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [selected, setSelected] = useState<ProjectType>("home");
  const [query, setQuery] = useState("");
  const [launching, setLaunching] = useState(false);

  function choose(id: ProjectType) {
    setSelected(id);
    track("hero_project_type_picked", { projectType: id });
  }

  /** Hand the choice to the builder and navigate into it mid-flow. */
  function launch() {
    if (launching) return;
    setLaunching(true);
    try {
      window.localStorage.setItem(PROJECT_TYPE_KEY, selected);
    } catch {
      // Persisting is best-effort — the query param still carries the choice.
    }
    track("hero_builder_launched", {
      projectType: selected,
      hasAddress: query.trim().length > 0,
    });
    const params = new URLSearchParams({ type: selected });
    const address = query.trim();
    if (address) params.set("address", address);
    router.push(`/builder?${params.toString()}`);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border-bright bg-surface shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]">
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-surface-2 px-4 py-3">
        <span className="size-3 rounded-full bg-[#3a3329]" />
        <span className="size-3 rounded-full bg-[#3a3329]" />
        <span className="size-3 rounded-full bg-[#3a3329]" />
        <div className="ml-3 flex h-6 flex-1 items-center rounded-md bg-ink px-3 text-[11px] text-muted-2">
          atelier.design/builder
        </div>
        <span className="hidden items-center gap-1.5 rounded-full border border-sage/40 bg-sage/10 px-2 py-0.5 text-[10px] font-medium text-sage sm:inline-flex">
          <span className="size-1.5 rounded-full bg-sage" />
          Live
        </span>
      </div>

      <div className="grid gap-px bg-border md:grid-cols-[1.15fr_1fr]">
        {/* left — the real first builder step */}
        <div className="bg-surface p-6 sm:p-7">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-2">
            Step 0 · Start your design
          </p>
          <h3 className="mt-2 font-display text-xl tracking-tight text-foreground">
            What are you building?
          </h3>

          <fieldset
            className="mt-4 grid grid-cols-2 gap-2"
            aria-label="What are you building?"
          >
            {PROJECT_TYPES.map((type) => {
              const active = type.id === selected;
              const locked = !type.available;
              return (
                <button
                  key={type.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-disabled={locked}
                  disabled={locked}
                  onClick={() => !locked && choose(type.id)}
                  className={cn(
                    "group relative flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper/40",
                    active
                      ? "border-copper bg-copper/10"
                      : "border-border bg-surface-2 hover:border-border-bright",
                    locked && "cursor-not-allowed opacity-55 hover:border-border",
                  )}
                >
                  <span
                    className={cn(
                      "font-display text-sm tracking-tight",
                      active ? "text-copper-bright" : "text-foreground",
                    )}
                  >
                    {type.label}
                  </span>
                  {active && (
                    <span className="grid size-4 shrink-0 place-items-center rounded-full bg-copper text-ink">
                      <Check className="size-2.5" />
                    </span>
                  )}
                  {locked && (
                    <span className="shrink-0 rounded-full border border-border bg-surface-3 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-muted-2">
                      Soon
                    </span>
                  )}
                </button>
              );
            })}
          </fieldset>

          <div className="mt-4">
            <label
              htmlFor="hero-address"
              className="text-[11px] uppercase tracking-[0.18em] text-muted-2"
            >
              Where is the lot?{" "}
              <span className="normal-case tracking-normal text-muted-2/70">
                (optional)
              </span>
            </label>
            <div className="relative mt-1.5">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-2" />
              <input
                id="hero-address"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && launch()}
                placeholder="123 Cedar Lane, Zionsville, IN"
                autoComplete="off"
                className="w-full rounded-lg border border-border bg-ink py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-2 transition-colors focus-visible:border-copper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper/30"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={launch}
            disabled={launching}
            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-copper px-6 text-sm font-medium text-ink shadow-[0_8px_30px_-12px_rgba(210,138,85,0.7)] transition-all duration-200 hover:bg-copper-bright hover:shadow-[0_12px_40px_-12px_rgba(236,171,120,0.8)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 focus-visible:ring-offset-ink disabled:opacity-60"
          >
            {launching ? "Opening the studio…" : "Open the builder"}
            {!launching && <ArrowRight className="size-4" />}
          </button>
          <p className="mt-2.5 text-center text-[11px] text-muted-2">
            3 designs free · No card · Picks up where you left off
          </p>
        </div>

        {/* right — a live preview that responds to the picked type */}
        <div className="relative flex flex-col justify-between bg-surface p-6 sm:p-7">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_70%_0%,rgba(210,138,85,0.1),transparent_70%)]"
          />
          <div className="relative">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-2">
              You&apos;re starting
            </p>
            <AnimatePresence mode="wait">
              <motion.div
                key={selected}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.32, ease: EASE }}
                className="mt-3"
              >
                <p className="font-display text-2xl tracking-tight text-copper-bright">
                  {currentLabel(selected)}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {currentDescription(selected)}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <ul className="relative mt-6 space-y-2.5">
            {PIPELINE.map((stage) => (
              <li key={stage} className="flex items-center gap-2.5 text-sm">
                <span className="grid size-5 shrink-0 place-items-center rounded-full border border-border-bright bg-surface-2">
                  <span className="size-1.5 rounded-full bg-copper" />
                </span>
                <span className="text-muted">{stage}</span>
              </li>
            ))}
          </ul>

          <div className="relative mt-6 flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-xs text-muted">
            <MapPin className="size-3.5 shrink-0 text-copper" />
            <span className="truncate">
              {query.trim()
                ? `Lot: ${query.trim()}`
                : "Add an address, or pick the lot on the map next."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The four moments the builder runs after the entry widget. */
const PIPELINE = [
  "Site the lot from public mapping data",
  "Describe the project in plain language",
  "Generate a code-checked plan",
  "Review, render, and share a portal",
] as const;

function currentLabel(id: ProjectType): string {
  return PROJECT_TYPES.find((t) => t.id === id)?.label ?? "Custom Home";
}

function currentDescription(id: ProjectType): string {
  return (
    PROJECT_TYPES.find((t) => t.id === id)?.description ??
    "A full custom house designed from lot to plan set."
  );
}
