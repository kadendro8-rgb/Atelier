"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Award,
  Handshake,
  MapPin,
  RotateCcw,
  Sparkles,
  Star,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  MATCHED_CONTRACTORS,
  type MatchedContractor,
} from "@/lib/network-mock";

const BUDGETS = ["$15k–$40k", "$40k–$80k", "$80k+"] as const;
const BUILD_TYPES = [
  "Paver patio",
  "Pool deck",
  "Outdoor kitchen",
  "Full backyard",
  "Retaining walls",
] as const;
const TIMELINES = [
  "Ready now",
  "3–6 months",
  "6–12 months",
  "Just exploring",
] as const;

type Quiz = {
  location: string;
  budget: string;
  buildType: string;
  timeline: string;
  name: string;
  email: string;
};

const EMPTY: Quiz = {
  location: "",
  budget: "",
  buildType: "",
  timeline: "",
  name: "",
  email: "",
};

export default function MatchPage() {
  const [quiz, setQuiz] = useState<Quiz>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const reduce = useReducedMotion();

  const complete =
    quiz.location.trim().length >= 3 &&
    quiz.budget !== "" &&
    quiz.buildType !== "" &&
    quiz.timeline !== "" &&
    quiz.name.trim().length >= 2 &&
    /.+@.+\..+/.test(quiz.email);

  function set<K extends keyof Quiz>(key: K, value: Quiz[K]) {
    setQuiz((q) => ({ ...q, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!complete) return;
    setSubmitted(true);
  }

  function reset() {
    setSubmitted(false);
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
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
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
            <Handshake className="size-3.5 text-copper" />
            Contractor match
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {!submitted ? (
          <motion.div {...reveal}>
            <div className="flex flex-col items-center text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted">
                <Sparkles className="size-3.5 text-copper" />
                v2.0 · Section 7.2
              </span>
              <h1 className="mt-4 font-display text-3xl tracking-tight sm:text-4xl">
                Find the right contractor
              </h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
                Answer five quick questions and Atelier surfaces three vetted
                outdoor-living contractors who build in your market and price
                range.
              </p>
            </div>

            <form
              onSubmit={submit}
              className="mt-8 rounded-card border border-border bg-surface p-5 sm:p-6"
            >
              <Field label="Where is the lot?" htmlFor="location">
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-2" />
                  <input
                    id="location"
                    type="text"
                    value={quiz.location}
                    onChange={(e) => set("location", e.target.value)}
                    placeholder="City and state, e.g. Carmel, IN"
                    className="w-full rounded-lg border border-border bg-ink py-3 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-2 transition-colors focus-visible:border-copper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper/30"
                  />
                </div>
              </Field>

              <Field label="Budget range" htmlFor="budget-group">
                <ChipGroup
                  id="budget-group"
                  options={[...BUDGETS]}
                  value={quiz.budget}
                  onChange={(v) => set("budget", v)}
                />
              </Field>

              <Field label="Build type" htmlFor="type-group">
                <ChipGroup
                  id="type-group"
                  options={[...BUILD_TYPES]}
                  value={quiz.buildType}
                  onChange={(v) => set("buildType", v)}
                />
              </Field>

              <Field label="Timeline" htmlFor="timeline-group">
                <ChipGroup
                  id="timeline-group"
                  options={[...TIMELINES]}
                  value={quiz.timeline}
                  onChange={(v) => set("timeline", v)}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Your name" htmlFor="name">
                  <input
                    id="name"
                    type="text"
                    value={quiz.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Jordan Avery"
                    className="w-full rounded-lg border border-border bg-ink p-3 text-sm text-foreground placeholder:text-muted-2 transition-colors focus-visible:border-copper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper/30"
                  />
                </Field>
                <Field label="Email" htmlFor="email">
                  <input
                    id="email"
                    type="email"
                    value={quiz.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="you@email.com"
                    className="w-full rounded-lg border border-border bg-ink p-3 text-sm text-foreground placeholder:text-muted-2 transition-colors focus-visible:border-copper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper/30"
                  />
                </Field>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={!complete}
                className="mt-2 w-full"
              >
                See my matches <ArrowRight className="size-4" />
              </Button>
              <p className="mt-3 text-center text-xs text-muted-2">
                Free for clients. Atelier earns a 1% referral fee only on a
                signed contract.
              </p>
            </form>
          </motion.div>
        ) : (
          <motion.div {...reveal}>
            <div className="flex flex-col items-center text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-sage/40 bg-sage/10 px-3 py-1.5 text-xs text-sage">
                <Sparkles className="size-3.5" />
                3 matches found
              </span>
              <h1 className="mt-4 font-display text-3xl tracking-tight sm:text-4xl">
                Contractors for {quiz.location}
              </h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
                Vetted for {quiz.buildType.toLowerCase()} builds in the{" "}
                {quiz.budget} range. We&apos;ll email {quiz.name.split(" ")[0]}{" "}
                an intro to any you pick.
              </p>
            </div>

            <ul className="mt-8 grid gap-3">
              {MATCHED_CONTRACTORS.map((contractor, i) => (
                <ContractorMatchCard
                  key={contractor.id}
                  contractor={contractor}
                  index={i}
                  reduce={Boolean(reduce)}
                />
              ))}
            </ul>

            <button
              type="button"
              onClick={reset}
              className="mx-auto mt-8 flex items-center gap-1.5 text-sm text-muted-2 underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              <RotateCcw className="size-3.5" />
              Edit my answers
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-2"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function ChipGroup({
  id,
  options,
  value,
  onChange,
}: {
  id: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div id={id} className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const on = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
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

function ContractorMatchCard({
  contractor,
  index,
  reduce,
}: {
  contractor: MatchedContractor;
  index: number;
  reduce: boolean;
}) {
  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.08 }}
      className="rounded-card border border-border bg-surface p-5 transition-colors hover:border-border-bright"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg tracking-tight">
              {contractor.name}
            </h3>
            <span className="rounded-full border border-border-bright bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-copper-bright">
              {contractor.priceBand}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">{contractor.tagline}</p>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <Star className="size-4 fill-copper text-copper" />
          <span className="font-medium text-foreground">
            {contractor.rating}
          </span>
          <span className="text-xs text-muted-2">({contractor.reviews})</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-3.5 text-copper" />
          {contractor.region}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Award className="size-3.5 text-copper" />
          {contractor.projectsBuilt}+ backyards built
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {contractor.specialties.map((s) => (
          <span
            key={s}
            className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[10px] text-muted"
          >
            {s}
          </span>
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <Button size="sm">
          Request intro <ArrowRight className="size-4" />
        </Button>
      </div>
    </motion.li>
  );
}
