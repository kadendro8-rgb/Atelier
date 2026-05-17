"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, HardHat, Network, Send } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CREW_SIZES = [
  "1–5 homes / year",
  "6–15 homes / year",
  "16–40 homes / year",
  "40+ homes / year",
] as const;

const PERKS = [
  "Pre-qualified clients with a finished design in hand",
  "Only a 1% referral fee, and only on a signed contract",
  "No exclusivity — keep building your own pipeline",
] as const;

type Application = {
  company: string;
  region: string;
  license: string;
  crew: string;
  contactName: string;
  email: string;
  phone: string;
};

const EMPTY: Application = {
  company: "",
  region: "",
  license: "",
  crew: "",
  contactName: "",
  email: "",
  phone: "",
};

export default function GcNetworkPage() {
  const [form, setForm] = useState<Application>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const reduce = useReducedMotion();

  const complete =
    form.company.trim().length >= 2 &&
    form.region.trim().length >= 2 &&
    form.license.trim().length >= 3 &&
    form.crew !== "" &&
    form.contactName.trim().length >= 2 &&
    /.+@.+\..+/.test(form.email) &&
    form.phone.trim().length >= 7;

  function set<K extends keyof Application>(key: K, value: Application[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!complete) return;
    setSubmitted(true);
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
            <Network className="size-3.5 text-copper" />
            GC network
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {submitted ? (
          <motion.div {...reveal} className="flex flex-col items-center text-center">
            <span className="grid size-14 place-items-center rounded-full border border-sage/40 bg-sage/10">
              <CheckCircle2 className="size-7 text-sage" />
            </span>
            <h1 className="mt-5 font-display text-3xl tracking-tight sm:text-4xl">
              Application received
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
              Thanks, {form.contactName.split(" ")[0]}. We verify license
              standing and crew capacity within two business days, then reach
              out to {form.email} about onboarding {form.company} into the{" "}
              {form.region} market.
            </p>
            <Link href="/" className="mt-8">
              <Button variant="outline" size="md">
                Back to Atelier
              </Button>
            </Link>
          </motion.div>
        ) : (
          <motion.div {...reveal}>
            <div className="flex flex-col items-center text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted">
                <HardHat className="size-3.5 text-copper" />
                v2.0 · Section 7.2
              </span>
              <h1 className="mt-4 font-display text-3xl tracking-tight sm:text-4xl">
                Join the GC network
              </h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
                Get matched with clients who already have a finished, stamped
                design — and a budget — for a home in your market.
              </p>
            </div>

            <ul className="mx-auto mt-6 grid max-w-xl gap-2">
              {PERKS.map((perk) => (
                <li
                  key={perk}
                  className="flex items-start gap-2 text-sm text-muted"
                >
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-sage" />
                  {perk}
                </li>
              ))}
            </ul>

            <form
              onSubmit={submit}
              className="mt-8 rounded-card border border-border bg-surface p-5 sm:p-6"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Company name" htmlFor="company">
                  <TextInput
                    id="company"
                    value={form.company}
                    onChange={(v) => set("company", v)}
                    placeholder="Hearthstone Builders"
                  />
                </Field>
                <Field label="Market / region" htmlFor="region">
                  <TextInput
                    id="region"
                    value={form.region}
                    onChange={(v) => set("region", v)}
                    placeholder="Greater Indianapolis, IN"
                  />
                </Field>
              </div>

              <Field label="Contractor license number" htmlFor="license">
                <TextInput
                  id="license"
                  value={form.license}
                  onChange={(v) => set("license", v)}
                  placeholder="e.g. IN-GC-0042817"
                />
              </Field>

              <Field label="Crew capacity" htmlFor="crew-group">
                <div id="crew-group" className="flex flex-wrap gap-2">
                  {CREW_SIZES.map((opt) => {
                    const on = form.crew === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => set("crew", opt)}
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
              </Field>

              <Field label="Primary contact" htmlFor="contactName">
                <TextInput
                  id="contactName"
                  value={form.contactName}
                  onChange={(v) => set("contactName", v)}
                  placeholder="Sam Reyes"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email" htmlFor="email">
                  <TextInput
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(v) => set("email", v)}
                    placeholder="sam@company.com"
                  />
                </Field>
                <Field label="Phone" htmlFor="phone">
                  <TextInput
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(v) => set("phone", v)}
                    placeholder="(317) 555-0148"
                  />
                </Field>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={!complete}
                className="mt-2 w-full"
              >
                <Send className="size-4" /> Submit application
              </Button>
              <p className="mt-3 text-center text-xs text-muted">
                We verify every license before a builder receives client
                introductions.
              </p>
            </form>
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
        className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function TextInput({
  id,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "text" | "email" | "tel";
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-border bg-ink p-3 text-sm text-foreground placeholder:text-muted-2 transition-colors focus-visible:border-copper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper/30"
    />
  );
}
