"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Design } from "@/lib/design";
import { Header } from "./PlanStep";
import { cn } from "@/lib/utils";

const angles = [
  "Front elevation",
  "Street approach",
  "Rear & yard",
  "Great room",
  "Kitchen",
  "Dusk exterior",
];

export function RenderStep({
  design,
  onBack,
  onContinue,
}: {
  design: Design;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();

  return (
    <div className="mx-auto max-w-5xl">
      <Header
        step="Step 4 · Renders"
        title="Photoreal renders, six angles"
        sub="Materials, daylight, and landscaping resolved. These are what your client falls for."
      />

      <div className="mt-7 rounded-card border border-border bg-surface p-4">
        <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-border">
          <AnimatePresence mode="sync">
            <motion.div
              key={active}
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.55, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <Image
                src={design.renders[active]}
                alt={`${design.projectName} — ${angles[active]}`}
                fill
                sizes="(max-width: 1024px) 100vw, 920px"
                className="object-cover"
                priority={active === 0}
              />
            </motion.div>
          </AnimatePresence>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full border border-border-bright bg-ink/80 px-3 py-1 text-xs text-foreground backdrop-blur">
            <Camera className="size-3.5 text-copper" />
            {angles[active]}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-6 gap-2">
          {design.renders.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "relative aspect-[4/3] overflow-hidden rounded-md border transition-colors",
                i === active
                  ? "border-copper"
                  : "border-border hover:border-border-bright",
              )}
              aria-label={angles[i]}
            >
              <Image src={src} alt="" fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <Button variant="subtle" onClick={onBack} className="flex-1 sm:flex-none sm:px-8">
          <ArrowLeft className="size-4" /> Site
        </Button>
        <Button onClick={onContinue} className="flex-[2] sm:flex-1">
          Build the client portal <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
