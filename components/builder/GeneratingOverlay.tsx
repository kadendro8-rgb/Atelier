"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";

const stages = [
  "Reading the brief",
  "Drafting the floor plan",
  "Checking code & zoning",
  "Rendering the design",
];

export function GeneratingOverlay() {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => {
      setActive((a) => Math.min(a + 1, stages.length - 1));
    }, 430);
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 grid place-items-center bg-ink/92 backdrop-blur-sm px-6"
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-sm rounded-card border border-border-bright bg-surface p-6">
        <div className="flex items-center gap-2.5">
          <Logo className="size-6 text-copper" />
          <span className="font-display text-base tracking-tight">
            Designing your home
          </span>
        </div>

        <ul className="mt-5 space-y-2.5">
          {stages.map((stage, i) => {
            const done = i < active;
            const current = i === active;
            return (
              <li key={stage} className="flex items-center gap-2.5 text-sm">
                <span className="grid size-5 place-items-center">
                  {done ? (
                    <Check className="size-4 text-sage" />
                  ) : current ? (
                    <Loader2 className="size-4 animate-spin text-copper" />
                  ) : (
                    <span className="size-2 rounded-full bg-border-bright" />
                  )}
                </span>
                <span className={done || current ? "text-foreground" : "text-muted-2"}>
                  {stage}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </motion.div>
  );
}
