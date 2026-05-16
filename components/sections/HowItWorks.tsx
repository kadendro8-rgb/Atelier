import { ArrowUp, Check, Lock, Pencil, ShieldCheck } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/Reveal";

const steps = [
  {
    n: "01",
    title: "Describe the home",
    body: "Talk to Atelier the way you'd brief a draftsperson. Square footage, bed count, the lot, the must-haves — plain language is the only input.",
  },
  {
    n: "02",
    title: "Refine the plan",
    body: "Atelier returns a real floor plan. Drag a wall, swap a room, resize the garage — every edit re-checks egress, spans, and code.",
  },
  {
    n: "03",
    title: "Site it on the parcel",
    body: "Drop the plan onto the client's actual lot. Setbacks, easements, and the buildable envelope are drawn from county GIS.",
  },
  {
    n: "04",
    title: "Get the deposit",
    body: "Share a branded client portal. Your client signs off on the design and pays the deposit without leaving the page.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 border-t border-border py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-copper">
            How it works
          </p>
          <h2 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">
            Four steps from a phone call to a funded project
          </h2>
          <p className="mt-4 text-muted">
            No CAD license, no outsourced drafting, no six-week wait. The whole
            loop happens while your client is still excited.
          </p>
        </Reveal>

        <RevealGroup className="mt-14 grid gap-6 md:grid-cols-2">
          {steps.map((step, i) => (
            <RevealItem key={step.n}>
              <article className="h-full overflow-hidden rounded-card border border-border bg-surface transition-colors hover:border-border-bright">
                <div className="relative h-56 border-b border-border bg-ink-2 p-5">
                  <Mockup index={i} />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3">
                    <span className="font-display text-sm text-copper">
                      {step.n}
                    </span>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                  <h3 className="mt-3 font-display text-xl tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {step.body}
                  </p>
                </div>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

function Mockup({ index }: { index: number }) {
  if (index === 0) return <ChatMockup />;
  if (index === 1) return <FloorPlanMockup />;
  if (index === 2) return <MapMockup />;
  return <PortalMockup />;
}

/* 01 — chat input */
function ChatMockup() {
  return (
    <div className="flex h-full flex-col justify-end gap-2.5">
      <div className="max-w-[80%] rounded-lg rounded-tl-sm bg-surface-2 px-3 py-2 text-[11px] leading-relaxed text-muted">
        Three-bed ranch, 1,850 sq ft, on the Cedar Lane lot. Open kitchen.
      </div>
      <div className="ml-auto max-w-[80%] rounded-lg rounded-tr-sm bg-copper/15 px-3 py-2 text-[11px] leading-relaxed text-copper-bright">
        Got it — generating the plan and checking the lot now.
      </div>
      <div className="flex items-center gap-2 rounded-full border border-border-bright bg-ink px-3 py-2">
        <span className="flex-1 text-[11px] text-muted-2">
          Add a screened porch off the kitchen
        </span>
        <span className="grid size-6 place-items-center rounded-full bg-copper text-ink">
          <ArrowUp className="size-3.5" />
        </span>
      </div>
    </div>
  );
}

/* 02 — floor plan with edit popover */
function FloorPlanMockup() {
  return (
    <div className="relative h-full">
      <svg
        viewBox="0 0 240 160"
        className="h-full w-full"
        aria-hidden="true"
        preserveAspectRatio="xMidYMid meet"
      >
        <rect
          x="6"
          y="6"
          width="228"
          height="148"
          fill="none"
          stroke="#423a2c"
          strokeWidth="2"
        />
        <line x1="120" y1="6" x2="120" y2="154" stroke="#423a2c" strokeWidth="1.5" />
        <line x1="6" y1="86" x2="120" y2="86" stroke="#423a2c" strokeWidth="1.5" />
        <line x1="120" y1="64" x2="234" y2="64" stroke="#423a2c" strokeWidth="1.5" />
        <rect
          x="124"
          y="68"
          width="106"
          height="82"
          fill="rgba(210,138,85,0.12)"
          stroke="#d28a55"
          strokeWidth="1.5"
        />
        <text x="14" y="30" fill="#79705f" fontSize="9">
          Bed 2
        </text>
        <text x="14" y="110" fill="#79705f" fontSize="9">
          Bed 3
        </text>
        <text x="130" y="28" fill="#79705f" fontSize="9">
          Primary
        </text>
        <text x="130" y="112" fill="#d28a55" fontSize="9">
          Great room
        </text>
      </svg>

      <div className="absolute right-3 top-2 w-36 rounded-lg border border-border-bright bg-surface-2 p-2.5 shadow-xl">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-foreground">
          <Pencil className="size-3 text-copper" />
          Great room
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted">
          <span>Span</span>
          <span className="text-foreground">22&apos;-0&quot;</span>
        </div>
        <div className="mt-1 flex items-center gap-1 text-[10px] text-sage">
          <Check className="size-3" /> Beam OK
        </div>
      </div>
    </div>
  );
}

/* 03 — parcel map */
function MapMockup() {
  return (
    <div className="relative h-full overflow-hidden rounded-lg">
      <svg
        viewBox="0 0 240 160"
        className="h-full w-full"
        aria-hidden="true"
        preserveAspectRatio="xMidYMid slice"
      >
        <rect width="240" height="160" fill="#100e0b" />
        {/* roads */}
        <path d="M-10 50 L250 36" stroke="#2c281f" strokeWidth="10" />
        <path d="M70 -10 L96 170" stroke="#2c281f" strokeWidth="10" />
        {/* neighbouring parcels */}
        <rect x="104" y="48" width="56" height="44" fill="none" stroke="#2c281f" strokeWidth="1.5" />
        <rect x="164" y="46" width="54" height="46" fill="none" stroke="#2c281f" strokeWidth="1.5" />
        <rect x="104" y="96" width="58" height="50" fill="none" stroke="#2c281f" strokeWidth="1.5" />
        {/* the parcel */}
        <polygon
          points="166,96 222,94 226,148 168,150"
          fill="rgba(210,138,85,0.15)"
          stroke="#d28a55"
          strokeWidth="2"
        />
        {/* buildable envelope */}
        <polygon
          points="178,108 212,107 214,138 180,139"
          fill="none"
          stroke="#8fa183"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <circle cx="196" cy="122" r="3.5" fill="#d28a55" />
      </svg>
      <div className="absolute left-3 top-3 rounded-md border border-border-bright bg-ink/85 px-2.5 py-1.5 text-[10px] text-foreground backdrop-blur">
        <span className="text-copper">Cedar Lane</span> · 0.61 ac
      </div>
      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md border border-sage/40 bg-ink/85 px-2.5 py-1.5 text-[10px] text-sage backdrop-blur">
        <span className="size-2 rounded-[2px] border border-dashed border-sage" />
        Buildable envelope · setbacks applied
      </div>
    </div>
  );
}

/* 04 — client portal with Pay button */
function PortalMockup() {
  return (
    <div className="flex h-full flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-foreground">
          Hillside Residence
        </span>
        <span className="flex items-center gap-1 text-[10px] text-sage">
          <ShieldCheck className="size-3" /> Approved
        </span>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {["Plans", "Renders", "Spec"].map((t) => (
          <div
            key={t}
            className="rounded-md border border-border bg-surface-2 px-2 py-3 text-center text-[10px] text-muted"
          >
            {t}
          </div>
        ))}
      </div>
      <div className="mt-auto rounded-lg border border-border-bright bg-surface-2 p-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted">Design deposit</span>
          <span className="font-display text-base text-foreground">$8,500</span>
        </div>
        <button
          type="button"
          className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-full bg-copper py-2 text-[11px] font-semibold text-ink"
        >
          <Lock className="size-3" />
          Pay deposit &amp; start build
        </button>
      </div>
    </div>
  );
}
