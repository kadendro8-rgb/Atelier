"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Check, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

export type BuilderStepKey =
  | "lot"
  | "brief"
  | "floor-plan"
  | "site"
  | "renders"
  | "portal";

const STEPS: { key: BuilderStepKey; label: string; href?: string }[] = [
  { key: "lot", label: "Lot", href: "/builder" },
  { key: "brief", label: "Brief", href: "/builder/brief" },
  { key: "floor-plan", label: "Floor plan", href: "/builder/floor-plan" },
  { key: "site", label: "Site" },
  { key: "renders", label: "Renders" },
  { key: "portal", label: "Portal" },
];

/** Shared chrome for every builder step — top bar plus a 6-step progress rail. */
export function BuilderShell({
  current,
  children,
}: {
  current: BuilderStepKey;
  children: ReactNode;
}) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <div className="flex min-h-dvh flex-col bg-ink">
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

          <ol className="flex items-center gap-1 sm:gap-1.5">
            {STEPS.map((step, i) => {
              const done = i < currentIndex;
              const active = i === currentIndex;
              const chip = (
                <span
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium transition-colors sm:px-2.5 sm:py-1.5",
                    active && "border-copper bg-copper/15 text-copper-bright",
                    done && "border-border-bright bg-surface-2 text-foreground",
                    !active && !done && "border-border bg-surface text-muted-2",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-4 place-items-center rounded-full text-[10px] sm:size-5",
                      active && "bg-copper text-ink",
                      done && "bg-sage text-ink",
                      !active && !done && "bg-surface-3 text-muted-2",
                    )}
                  >
                    {done ? <Check className="size-2.5 sm:size-3" /> : i + 1}
                  </span>
                  <span className="hidden md:inline">{step.label}</span>
                </span>
              );
              return (
                <li
                  key={step.key}
                  className="flex items-center gap-1 sm:gap-1.5"
                >
                  {done && step.href ? (
                    <Link href={step.href} aria-label={`Back to ${step.label}`}>
                      {chip}
                    </Link>
                  ) : (
                    <span aria-current={active ? "step" : undefined}>
                      {chip}
                    </span>
                  )}
                  {i < STEPS.length - 1 && (
                    <span
                      className={cn(
                        "h-px w-2 sm:w-4",
                        i < currentIndex ? "bg-sage/50" : "bg-border",
                      )}
                    />
                  )}
                </li>
              );
            })}
          </ol>

          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-border-bright hover:text-foreground"
          >
            <X className="size-3.5" />
            <span className="hidden sm:inline">Exit</span>
          </Link>
        </div>
      </header>

      <main className="relative flex-1 px-4 py-10 sm:px-6 sm:py-16">
        {children}
      </main>
    </div>
  );
}
