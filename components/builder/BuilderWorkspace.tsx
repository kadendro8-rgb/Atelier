"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Info, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import {
  buildDesign,
  normalizeParams,
  parseBriefLocally,
  type Design,
  type PlanOptions,
} from "@/lib/design";
import { Stepper, type StepKey } from "./Stepper";
import { BriefStep } from "./BriefStep";
import { PlanStep } from "./PlanStep";
import { SiteStep } from "./SiteStep";
import { RenderStep } from "./RenderStep";
import { PortalStep } from "./PortalStep";
import { GeneratingOverlay } from "./GeneratingOverlay";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const AI_FALLBACK_NOTICE =
  "AI parser briefly unavailable. We used the local parser — quality is good but you can regenerate in a moment for the full result.";

function optionsFor(design: Design): PlanOptions {
  return {
    garageBays: design.params.garageBays,
    porch: design.params.features.some((f) => /porch/i.test(f)),
    office: design.params.features.some((f) => /office|study|den/i.test(f)),
  };
}

export function BuilderWorkspace() {
  const [step, setStep] = useState<StepKey>("brief");
  const [design, setDesign] = useState<Design | null>(null);
  const [planOpts, setPlanOpts] = useState<PlanOptions | null>(null);
  const [generating, setGenerating] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const reduce = useReducedMotion();

  const handleSubmit = useCallback(
    async (brief: string) => {
      setGenerating(true);
      setAiNotice(null);
      let params;
      let notice: string | null = null;
      try {
        const [res] = await Promise.all([
          fetch("/api/design", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ brief }),
          }),
          delay(reduce ? 0 : 1700),
        ]);
        const data = await res.json();
        if (data?.source === "ai" && data.params) {
          params = normalizeParams(data.params, brief);
        } else {
          params = parseBriefLocally(brief);
          // A `notice` on a fallback means the AI call actually failed —
          // a key-less demo run returns a quiet fallback with no notice.
          if (data?.source === "fallback" && data?.notice) {
            notice = AI_FALLBACK_NOTICE;
          }
        }
      } catch {
        params = parseBriefLocally(brief);
        notice = AI_FALLBACK_NOTICE;
      }
      const next = buildDesign(params);
      setDesign(next);
      setPlanOpts(optionsFor(next));
      setAiNotice(notice);
      setGenerating(false);
      setStep("plan");
    },
    [reduce],
  );

  const restart = useCallback(() => {
    setDesign(null);
    setPlanOpts(null);
    setAiNotice(null);
    setStep("brief");
  }, []);

  return (
    <div className="flex min-h-dvh flex-col">
      {/* top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-ink/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
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

          <Stepper
            current={step}
            onNavigate={(k) => {
              if (design || k === "brief") setStep(k);
            }}
          />

          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:border-border-bright hover:text-foreground"
          >
            <X className="size-3.5" />
            <span className="hidden sm:inline">Exit</span>
          </Link>
        </div>
      </header>

      <main className="relative flex-1 px-4 py-10 sm:px-6 sm:py-14">
        {aiNotice && (
          <div className="mx-auto mb-6 max-w-2xl">
            <div className="flex items-start gap-3 rounded-lg border border-copper/60 bg-copper/5 px-4 py-3">
              <Info className="mt-0.5 size-4 shrink-0 text-copper" />
              <p className="flex-1 text-xs leading-relaxed text-muted">
                {aiNotice}
              </p>
              <button
                type="button"
                onClick={() => setAiNotice(null)}
                aria-label="Dismiss"
                className="text-muted-2 transition-colors hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {step === "brief" && (
              <BriefStep onSubmit={handleSubmit} busy={generating} />
            )}
            {step === "plan" && design && planOpts && (
              <PlanStep
                design={design}
                options={planOpts}
                onOptionsChange={setPlanOpts}
                onBack={() => setStep("brief")}
                onContinue={() => setStep("site")}
              />
            )}
            {step === "site" && design && (
              <SiteStep
                design={design}
                onBack={() => setStep("plan")}
                onContinue={() => setStep("renders")}
              />
            )}
            {step === "renders" && design && (
              <RenderStep
                design={design}
                onBack={() => setStep("site")}
                onContinue={() => setStep("portal")}
              />
            )}
            {step === "portal" && design && (
              <PortalStep
                design={design}
                onBack={() => setStep("renders")}
                onRestart={restart}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatePresence>{generating && <GeneratingOverlay />}</AnimatePresence>
    </div>
  );
}
