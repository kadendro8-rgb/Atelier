"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Compass, Ruler } from "lucide-react";
import { BuilderShell } from "@/components/builder/BuilderShell";
import { Button } from "@/components/ui/button";
import type { ParsedRequirements } from "@/lib/builder";

const titleCase = (s: string) =>
  s.replace(/\b\w/g, (c) => c.toUpperCase());

export default function FloorPlanPage() {
  const [parsed, setParsed] = useState<ParsedRequirements | null>(null);
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();
  const reduce = useReducedMotion();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("atelier:parsed");
      if (raw) setParsed(JSON.parse(raw) as ParsedRequirements);
    } catch {
      // ignore corrupt storage
    }
    setLoaded(true);
  }, []);

  if (loaded && !parsed) {
    return (
      <BuilderShell current="floor-plan">
        <div className="mx-auto max-w-md text-center">
          <h1 className="font-display text-2xl tracking-tight">
            No brief yet
          </h1>
          <p className="mt-2 text-sm text-muted">
            Describe the home first and Atelier will draft the floor plan from
            it.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/builder/brief">
              Start the brief <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </BuilderShell>
    );
  }

  const reveal = reduce
    ? {}
    : ({
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease: "easeOut" },
      } as const);

  return (
    <BuilderShell current="floor-plan">
      <motion.div {...reveal} className="mx-auto max-w-5xl">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted">
            <Compass className="size-3.5 text-copper" />
            Step 2 · Floor plan
          </span>
          <h1 className="mt-4 font-display text-3xl tracking-tight sm:text-4xl">
            Your floor plan is taking shape
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Atelier read the brief into a structured program. Review it, then
            continue to site the home on the lot.
          </p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_1.5fr]">
          {parsed && <ProgramCard parsed={parsed} />}

          <div className="flex flex-col rounded-card border border-border bg-surface p-5">
            <PlanSchematic />
            <p className="mt-4 text-xs text-muted-2">
              Schematic preview. The drag-editable plan canvas with live IRC
              code checks is the next milestone — see{" "}
              <code className="text-muted">docs/v2-spec.md</code>.
            </p>
            <Button
              onClick={() => router.push("/builder/brief")}
              size="lg"
              className="mt-5"
            >
              Approve &amp; continue to site <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </BuilderShell>
  );
}

function ProgramCard({ parsed }: { parsed: ParsedRequirements }) {
  const stats = [
    { label: "Finished area", value: `${parsed.sqft.toLocaleString()} ft²` },
    { label: "Bedrooms", value: String(parsed.beds) },
    { label: "Bathrooms", value: String(parsed.baths) },
    {
      label: "Stories",
      value:
        parsed.story_count === 1 ? "Single story" : `${parsed.story_count} stories`,
    },
  ];

  return (
    <aside className="h-fit rounded-card border border-border bg-surface p-5">
      <div className="flex items-center gap-2">
        <Ruler className="size-4 text-copper" />
        <h2 className="text-sm font-medium text-foreground">Parsed program</h2>
      </div>

      <p className="mt-3 font-display text-xl tracking-tight text-copper-bright">
        {titleCase(parsed.style)}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border">
        {stats.map((s) => (
          <div key={s.label} className="bg-surface-2 p-3">
            <dt className="text-[10px] uppercase tracking-wide text-muted-2">
              {s.label}
            </dt>
            <dd className="mt-0.5 text-sm font-medium text-foreground">
              {s.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
        <span className="text-muted-2">Lot</span>
        <span className="font-medium text-foreground">{parsed.lot_size}</span>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-muted-2">Code basis</span>
        <span className="font-medium text-foreground">
          {parsed.code_jurisdiction_hint}
        </span>
      </div>

      {parsed.must_haves.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] uppercase tracking-wide text-muted-2">
            Must-haves
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {parsed.must_haves.map((m) => (
              <span
                key={m}
                className="rounded-full border border-copper/30 bg-copper/10 px-2.5 py-1 text-xs text-copper-bright"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

function PlanSchematic() {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-ink-2">
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-border) 1px,transparent 1px),linear-gradient(90deg,var(--color-border) 1px,transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <svg
        viewBox="0 0 400 300"
        className="absolute inset-0 size-full"
        aria-hidden="true"
      >
        <g className="fill-copper/[0.07] stroke-copper/70" strokeWidth="3">
          <rect x="40" y="40" width="320" height="220" />
          <line x1="200" y1="40" x2="200" y2="260" />
          <line x1="40" y1="150" x2="200" y2="150" />
          <line x1="200" y1="170" x2="360" y2="170" />
          <line x1="280" y1="40" x2="280" y2="170" />
        </g>
        <g className="fill-copper/15">
          <rect x="44" y="44" width="152" height="102" />
          <rect x="204" y="174" width="152" height="82" />
        </g>
      </svg>
      <div className="absolute left-3 top-3 rounded-full border border-border bg-ink/80 px-2.5 py-1 text-[10px] text-muted backdrop-blur">
        Schematic preview
      </div>
    </div>
  );
}
