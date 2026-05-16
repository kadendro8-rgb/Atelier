"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Info, Sparkles, Wand2, X } from "lucide-react";
import { BuilderShell } from "@/components/builder/BuilderShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  {
    label: "Modern farmhouse",
    text: "4-bed single-story modern farmhouse, ~2,900 sq ft. Vaulted great room, a home office off the entry, wraparound porch. 0.6-acre lot, 3-car garage.",
  },
  {
    label: "Lake home",
    text: "3-bed lake home on a 1.2-acre waterfront lot. Two stories with a walkout lower level, a glass rear wall facing the water, and a screened porch.",
  },
  {
    label: "Craftsman bungalow",
    text: "Compact 2-bed, 2-bath craftsman bungalow, ~1,900 sq ft, single story. Front porch with exposed rafter tails, open-concept kitchen, 2-car garage.",
  },
];

const STAGES = [
  "Parsing brief",
  "Drafting floor plan",
  "Sizing rooms",
  "Opening floor plan",
] as const;

export default function BriefPage() {
  const [brief, setBrief] = useState("");
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [stage, setStage] = useState(-1);
  const [saveOpen, setSaveOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const reduce = useReducedMotion();

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const generating = stage >= 0;
  const ready = brief.trim().length >= 12 && !generating;

  function pickExample(ex: (typeof EXAMPLES)[number]) {
    setBrief(ex.text);
    setActiveChip(ex.label);
    textareaRef.current?.focus();
  }

  async function generate() {
    if (!ready) return;
    setStage(0);
    const started = Date.now();

    const request = fetch("/api/parse-brief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief: brief.trim() }),
    })
      .then((r) => r.json())
      .catch(() => null);

    const t1 = window.setTimeout(() => setStage(1), 900);
    const t2 = window.setTimeout(() => setStage(2), 2600);

    const data = await request;
    const elapsed = Date.now() - started;
    if (elapsed < 3800) {
      await new Promise((r) => setTimeout(r, 3800 - elapsed));
    }
    window.clearTimeout(t1);
    window.clearTimeout(t2);

    localStorage.setItem("atelier:brief", brief.trim());
    if (data?.parsed) {
      localStorage.setItem("atelier:parsed", JSON.stringify(data.parsed));
    } else {
      localStorage.removeItem("atelier:parsed");
    }

    setStage(3);
    window.setTimeout(() => router.push("/builder/floor-plan"), 550);
  }

  const reveal = reduce
    ? {}
    : ({
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease: "easeOut" },
      } as const);

  return (
    <BuilderShell current="brief">
      <motion.div {...reveal} className="mx-auto max-w-2xl">
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted">
            <Sparkles className="size-3.5 text-copper" />
            Step 1 · The brief
          </span>
          <h1 className="mt-4 font-display text-3xl tracking-tight sm:text-4xl">
            Describe the home your client wants
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
            Write it the way you would brief a draftsperson — style, size,
            bedrooms, the lot, the must-haves. Atelier takes it from there.
          </p>
        </div>

        <div className="mt-8 rounded-card border border-border bg-surface p-5">
          <p className="text-xs text-muted-2">Start from an example</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => {
              const on = activeChip === ex.label;
              return (
                <button
                  key={ex.label}
                  type="button"
                  disabled={generating}
                  onClick={() => pickExample(ex)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
                    on
                      ? "border-copper bg-copper text-ink"
                      : "border-border bg-surface-2 text-muted hover:border-copper hover:text-copper-bright",
                  )}
                >
                  {ex.label}
                </button>
              );
            })}
          </div>

          {activeChip && (
            <p className="mt-3 text-xs italic text-muted-2">
              Generated brief — edit before continuing.
            </p>
          )}

          <label htmlFor="brief" className="sr-only">
            Design brief
          </label>
          <textarea
            id="brief"
            ref={textareaRef}
            value={brief}
            onChange={(e) => {
              setBrief(e.target.value);
              setActiveChip(null);
            }}
            disabled={generating}
            rows={6}
            placeholder="e.g. 4-bed modern farmhouse, ~2,900 sq ft, single story, vaulted great room, walkout basement on a 1.5-acre lake lot."
            className="mt-3 w-full resize-y rounded-lg border border-border bg-ink p-3.5 text-sm leading-relaxed text-foreground placeholder:text-muted-2 transition-colors focus-visible:border-copper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper/30 disabled:opacity-60"
          />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setSaveOpen(true)}
              disabled={generating}
              className="text-sm text-muted-2 underline-offset-4 transition-colors hover:text-foreground hover:underline disabled:opacity-50"
            >
              Save brief and come back later →
            </button>

            <div className="flex items-center gap-2">
              <InfoTip />
              <Button
                onClick={generate}
                disabled={!ready}
                size="lg"
                className="min-w-[15rem]"
              >
                {generating ? (
                  <>
                    <Wand2 className="size-4 animate-pulse" />
                    {STAGES[stage]}…
                  </>
                ) : (
                  <>
                    Generate the design <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {saveOpen && (
        <SaveDialog brief={brief} onClose={() => setSaveOpen(false)} />
      )}
    </BuilderShell>
  );
}

function InfoTip() {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label="How the brief is parsed"
        className="grid size-11 place-items-center rounded-full border border-border bg-surface text-muted-2 transition-colors hover:border-border-bright hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper/40"
      >
        <Info className="size-4" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full right-0 z-10 mb-2 w-64 rounded-lg border border-border bg-surface-2 p-3 text-xs leading-relaxed text-muted opacity-0 shadow-xl transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        Runs as an interactive demo. With an Atelier API key configured the
        brief is parsed by Claude; otherwise it is read on-device.
      </span>
    </span>
  );
}

function SaveDialog({
  brief,
  onClose,
}: {
  brief: string;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"form" | "saving" | "done">("form");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("saving");
    try {
      await fetch("/api/save-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, brief }),
      });
    } catch {
      // best-effort — still confirm to the user
    }
    setState("done");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Save brief for later"
        className="w-full max-w-sm rounded-card border border-border bg-surface p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-lg tracking-tight">
            {state === "done" ? "Saved" : "Save brief and come back later"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-muted-2 transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {state === "done" ? (
          <div className="mt-4">
            <div className="flex items-center gap-2 text-sm text-sage">
              <Check className="size-4" />
              Saved. Check your inbox for the link.
            </div>
            <Button onClick={onClose} size="md" className="mt-5 w-full">
              Back to the brief
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-4">
            <p className="text-sm text-muted">
              Drop your email and we&apos;ll send the brief plus a link back to
              keep designing.
            </p>
            <input
              ref={inputRef}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="mt-4 w-full rounded-lg border border-border bg-ink p-3 text-sm text-foreground placeholder:text-muted-2 focus-visible:border-copper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper/30"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={state === "saving"}>
                {state === "saving" ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
