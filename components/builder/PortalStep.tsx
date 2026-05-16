"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, BedDouble, Check, Lock, RotateCcw, Ruler, Trees } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import type { Design } from "@/lib/design";
import { Header } from "./PlanStep";

export function PortalStep({
  design,
  onBack,
  onRestart,
}: {
  design: Design;
  onBack: () => void;
  onRestart: () => void;
}) {
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const reduce = useReducedMotion();

  const { params, pricing } = design;

  const pay = () => {
    setPaying(true);
    window.setTimeout(() => {
      setPaying(false);
      setPaid(true);
    }, reduce ? 0 : 1100);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Header
        step="Step 5 · Client portal"
        title="Share it — and collect the deposit"
        sub="A branded portal where your client reviews the design, signs off, and pays without leaving the page."
      />

      <div className="mt-7 overflow-hidden rounded-card border border-border-bright bg-surface">
        {/* portal header */}
        <div className="flex items-center justify-between border-b border-border bg-surface-2 px-5 py-3">
          <div className="flex items-center gap-2">
            <Logo className="size-5 text-copper" />
            <span className="font-display text-sm tracking-tight">
              {design.projectName}
            </span>
          </div>
          <span className="rounded-full border border-border bg-ink px-2.5 py-1 text-[11px] text-muted-2">
            Client portal
          </span>
        </div>

        <div className="grid gap-px bg-border sm:grid-cols-2">
          <div className="relative aspect-[4/3] bg-surface sm:aspect-auto">
            <Image
              src={design.style.image}
              alt={`${design.projectName} render`}
              fill
              sizes="(max-width: 640px) 100vw, 360px"
              className="object-cover"
            />
          </div>
          <div className="bg-surface p-5">
            <p className="text-xs uppercase tracking-[0.15em] text-copper">
              {design.style.label}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {params.summary}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { icon: Ruler, value: `${params.sqft.toLocaleString()} sf` },
                { icon: BedDouble, value: `${params.beds} bd · ${params.baths} ba` },
                { icon: Trees, value: `${params.lotAcres} ac` },
              ].map(({ icon: Icon, value }) => (
                <div
                  key={value}
                  className="rounded-md border border-border bg-surface-2 px-2 py-2.5 text-center"
                >
                  <Icon className="mx-auto size-3.5 text-copper" />
                  <span className="mt-1 block text-[11px] text-muted">{value}</span>
                </div>
              ))}
            </div>
            {params.features.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {params.features.map((f) => (
                  <span
                    key={f}
                    className="rounded-full border border-border bg-ink px-2 py-0.5 text-[10px] text-muted"
                  >
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* payment */}
        <div className="border-t border-border p-5">
          <AnimatePresence mode="wait">
            {paid ? (
              <motion.div
                key="paid"
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-sage/20 text-sage">
                  <Check className="size-6" />
                </div>
                <p className="mt-3 font-display text-lg tracking-tight">
                  Deposit received — the build is funded
                </p>
                <p className="mx-auto mt-1 max-w-sm text-xs text-muted">
                  ${pricing.total.toLocaleString()} cleared. Atelier emailed the
                  permit-ready set to your draftsperson and logged the client&apos;s
                  approval.
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  <Button variant="subtle" size="sm" onClick={onRestart}>
                    <RotateCcw className="size-4" /> Design another
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="unpaid"
                initial={false}
                exit={reduce ? undefined : { opacity: 0 }}
              >
                <p className="text-xs font-medium text-foreground">
                  Design agreement
                </p>
                <ul className="mt-2.5 divide-y divide-border">
                  <Line label="Design consultation" value={pricing.consultation} />
                  <Line
                    label={`Design deposit · ${design.style.label}`}
                    value={pricing.designDeposit}
                  />
                </ul>
                <div className="mt-2.5 flex items-center justify-between border-t border-border-bright pt-2.5">
                  <span className="text-sm font-medium">Due to start the build</span>
                  <span className="font-display text-xl text-copper">
                    ${pricing.total.toLocaleString()}
                  </span>
                </div>
                <Button
                  className="mt-4 w-full"
                  size="lg"
                  disabled={paying}
                  onClick={pay}
                >
                  <Lock className="size-4" />
                  {paying ? "Processing…" : `Pay deposit & start build`}
                </Button>
                <p className="mt-2 text-center text-[11px] text-muted-2">
                  Demo only — no card is charged.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-5 flex justify-center">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="size-4" /> Back to renders
        </Button>
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: number }) {
  return (
    <li className="flex items-center justify-between py-2 text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-foreground">
        ${value.toLocaleString()}
      </span>
    </li>
  );
}
