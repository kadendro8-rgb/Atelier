"use client";

import { useState } from "react";
import { ArrowRight, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const examples = [
  {
    label: "Modern farmhouse",
    text: "Four-bed modern farmhouse, about 2,900 sq ft, single story. Vaulted great room, a home office off the entry, and a covered porch. Half-acre lot, 3-car garage.",
  },
  {
    label: "Lake home",
    text: "Five-bedroom lake home on a 1.2-acre waterfront lot. Two stories with a walkout lower level, lots of glass facing the water, and a screened porch.",
  },
  {
    label: "Craftsman bungalow",
    text: "Compact 3-bed, 2-bath craftsman bungalow around 1,900 sq ft on a small in-town lot. Single story, open-concept kitchen, 2-car garage.",
  },
];

export function BriefStep({
  onSubmit,
  busy,
}: {
  onSubmit: (brief: string) => void;
  busy: boolean;
}) {
  const [brief, setBrief] = useState("");
  const ready = brief.trim().length >= 12 && !busy;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted">
          <Sparkles className="size-3.5 text-copper" />
          Step 1 · The brief
        </span>
        <h1 className="mt-4 font-display text-3xl tracking-tight sm:text-4xl">
          Describe the home your client wants
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm text-muted">
          Write it the way you&apos;d brief a draftsperson — style, size,
          bedrooms, the lot, the must-haves. Atelier takes it from there.
        </p>
      </div>

      <div className="mt-8 rounded-card border border-border bg-surface p-5">
        <label htmlFor="brief" className="text-xs font-medium text-muted-2">
          Design brief
        </label>
        <textarea
          id="brief"
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          rows={5}
          disabled={busy}
          placeholder="e.g. Four-bed modern farmhouse, ~2,900 sq ft, single story, vaulted great room, covered porch, half-acre lot…"
          className="mt-2 w-full resize-none rounded-lg border border-border bg-ink p-3.5 text-sm leading-relaxed text-foreground placeholder:text-muted-2 transition-colors focus-visible:border-copper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper/30"
        />

        <div className="mt-3">
          <p className="text-xs text-muted-2">Or start from an example:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {examples.map((ex) => (
              <button
                key={ex.label}
                type="button"
                disabled={busy}
                onClick={() => setBrief(ex.text)}
                className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs text-muted transition-colors hover:border-copper hover:text-copper-bright disabled:opacity-50"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        <Button
          className="mt-5 w-full"
          size="lg"
          disabled={!ready}
          onClick={() => onSubmit(brief.trim())}
        >
          {busy ? (
            <>
              <Wand2 className="size-4 animate-pulse" />
              Designing…
            </>
          ) : (
            <>
              Generate the design <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </div>

      <p className="mt-3 text-center text-xs text-muted-2">
        Runs as an interactive demo. With an Atelier API key configured, the
        brief is parsed by Claude — otherwise it&apos;s read on-device.
      </p>
    </div>
  );
}
