"use client";

import { ArrowUp, Check, Lock, Pencil, ShieldCheck, MessageSquare, PenTool, Map, CreditCard } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/Reveal";

const steps = [
  {
    n: "01",
    icon: MessageSquare,
    title: "Describe the space",
    body: "Tell Atelier what the client wants — a paver patio, a pool deck, an outdoor kitchen, the whole yard. Plain language, measured in feet, is the only input.",
  },
  {
    n: "02",
    icon: PenTool,
    title: "Refine the layout",
    body: "Atelier returns a real scaled layout. Move the patio edge, swap pavers for stamped concrete, add a fire feature — the estimate updates with every change.",
  },
  {
    n: "03",
    icon: Map,
    title: "Site it on the lot",
    body: "Drop the design onto the client's actual property. Grade, drainage, setbacks for pools and structures, and the usable yard are drawn from county GIS.",
  },
  {
    n: "04",
    icon: CreditCard,
    title: "Get the deposit",
    body: "Share a branded client portal. Your client signs off on the design and pays the deposit without leaving the page.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 border-t border-border py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Section header */}
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-copper">
            How it works
          </p>
          <h2 className="mt-4 font-display text-3xl tracking-tight sm:text-4xl lg:text-5xl">
            Four steps from a backyard walk-through to a{" "}
            <span className="text-gradient-copper">signed job</span>
          </h2>
          <p className="mt-5 text-lg text-muted">
            No CAD license, no landscape-architect design fee, no two-week wait
            for a drawing. The whole loop happens in the client&apos;s backyard.
          </p>
        </Reveal>

        {/* Steps timeline */}
        <div className="relative mt-20">
          {/* Connection line */}
          <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-border via-copper/30 to-border lg:block" />

          <RevealGroup className="grid gap-8 lg:gap-16">
            {steps.map((step, i) => (
              <RevealItem key={step.n}>
                <div className={`flex flex-col gap-8 lg:flex-row lg:items-center ${i % 2 === 1 ? "lg:flex-row-reverse" : ""}`}>
                  {/* Content side */}
                  <div className={`flex-1 ${i % 2 === 1 ? "lg:text-right" : ""}`}>
                    <div className={`inline-flex items-center gap-3 ${i % 2 === 1 ? "lg:flex-row-reverse" : ""}`}>
                      <span className="flex size-12 items-center justify-center rounded-xl border border-border-bright bg-surface-2 font-display text-lg text-copper transition-all duration-300 hover:border-copper hover:bg-copper/10">
                        {step.n}
                      </span>
                      <step.icon className="size-5 text-muted-2" />
                    </div>
                    <h3 className="mt-4 font-display text-2xl tracking-tight lg:text-3xl">
                      {step.title}
                    </h3>
                    <p className="mt-3 max-w-md text-base leading-relaxed text-muted lg:text-lg">
                      {step.body}
                    </p>
                  </div>

                  {/* Center node */}
                  <div className="relative hidden lg:flex lg:items-center lg:justify-center">
                    <div className="relative z-10 flex size-16 items-center justify-center rounded-full border border-copper bg-surface transition-all duration-500 hover:scale-110">
                      <div className="size-4 rounded-full bg-copper shadow-[0_0_20px_rgba(212,165,116,0.5)]" />
                    </div>
                  </div>

                  {/* Visual side */}
                  <div className="flex-1">
                    <div className="overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-400 hover:border-border-bright">
                      <div className="relative h-64 border-b border-border bg-ink-2 p-5 lg:h-72">
                        <Mockup index={i} />
                      </div>
                    </div>
                  </div>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}

function Mockup({ index }: { index: number }) {
  if (index === 0) return <ChatMockup />;
  if (index === 1) return <LayoutMockup />;
  if (index === 2) return <MapMockup />;
  return <PortalMockup />;
}

/* 01 - chat input */
function ChatMockup() {
  return (
    <div className="flex h-full flex-col justify-end gap-3">
      <div className="max-w-[80%] rounded-xl rounded-tl-sm bg-surface-2 px-4 py-3 text-sm leading-relaxed text-muted transition-all duration-300 hover:bg-surface-3">
        Flagstone patio off the kitchen, ~480 sq ft, with a fire-pit lounge.
      </div>
      <div className="ml-auto max-w-[80%] rounded-xl rounded-tr-sm bg-copper/10 px-4 py-3 text-sm leading-relaxed text-copper-bright">
        Got it — laying out the patio and checking the lot now.
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-border-bright bg-ink px-4 py-3 transition-all duration-300 hover:border-copper">
        <span className="flex-1 text-sm text-muted-2">
          Add a paver walkway to the driveway
        </span>
        <span className="grid size-8 place-items-center rounded-lg bg-copper text-ink transition-all duration-300 hover:bg-copper-bright hover:scale-105">
          <ArrowUp className="size-4" />
        </span>
      </div>
    </div>
  );
}

/* 02 - layout with edit popover */
function LayoutMockup() {
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
          stroke="#3f3f46"
          strokeWidth="2"
        />
        <line x1="120" y1="6" x2="120" y2="154" stroke="#3f3f46" strokeWidth="1.5" />
        <line x1="6" y1="86" x2="120" y2="86" stroke="#3f3f46" strokeWidth="1.5" />
        <line x1="120" y1="64" x2="234" y2="64" stroke="#3f3f46" strokeWidth="1.5" />
        <rect
          x="124"
          y="68"
          width="106"
          height="82"
          fill="rgba(212,165,116,0.1)"
          stroke="#d4a574"
          strokeWidth="1.5"
        />
        <text x="14" y="30" fill="#71717a" fontSize="9">
          Patio A
        </text>
        <text x="14" y="110" fill="#71717a" fontSize="9">
          Fire pit
        </text>
        <text x="130" y="28" fill="#71717a" fontSize="9">
          Kitchen
        </text>
        <text x="130" y="112" fill="#d4a574" fontSize="9">
          Great room
        </text>
      </svg>

      <div className="absolute right-4 top-3 w-40 rounded-xl border border-border-bright bg-surface-2 p-3 shadow-xl transition-all duration-300 hover:border-copper">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Pencil className="size-3.5 text-copper" />
          Great room
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted">
          <span>Span</span>
          <span className="text-foreground">22&apos;-0&quot;</span>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-sage">
          <Check className="size-3.5" /> Beam OK
        </div>
      </div>
    </div>
  );
}

/* 03 - parcel map */
function MapMockup() {
  return (
    <div className="relative h-full overflow-hidden rounded-lg">
      <svg
        viewBox="0 0 240 160"
        className="h-full w-full"
        aria-hidden="true"
        preserveAspectRatio="xMidYMid slice"
      >
        <rect width="240" height="160" fill="#0c0c0f" />
        {/* roads */}
        <path d="M-10 50 L250 36" stroke="#27272a" strokeWidth="10" />
        <path d="M70 -10 L96 170" stroke="#27272a" strokeWidth="10" />
        {/* neighbouring parcels */}
        <rect x="104" y="48" width="56" height="44" fill="none" stroke="#27272a" strokeWidth="1.5" />
        <rect x="164" y="46" width="54" height="46" fill="none" stroke="#27272a" strokeWidth="1.5" />
        <rect x="104" y="96" width="58" height="50" fill="none" stroke="#27272a" strokeWidth="1.5" />
        {/* the parcel */}
        <polygon
          points="166,96 222,94 226,148 168,150"
          fill="rgba(212,165,116,0.15)"
          stroke="#d4a574"
          strokeWidth="2"
        />
        {/* buildable envelope */}
        <polygon
          points="178,108 212,107 214,138 180,139"
          fill="none"
          stroke="#22c55e"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <circle cx="196" cy="122" r="4" fill="#d4a574" />
      </svg>
      <div className="absolute left-4 top-4 rounded-lg border border-border-bright bg-ink/90 px-3 py-2 text-xs text-foreground backdrop-blur transition-all duration-300 hover:border-copper">
        <span className="text-copper">Cedar Lane</span> &middot; 0.61 ac
      </div>
      <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-lg border border-sage/40 bg-ink/90 px-3 py-2 text-xs text-sage backdrop-blur">
        <span className="size-2.5 rounded border border-dashed border-sage" />
        Buildable envelope · setbacks applied
      </div>
    </div>
  );
}

/* 04 - client portal with Pay button */
function PortalMockup() {
  return (
    <div className="flex h-full flex-col gap-4 p-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          Cedar Lane Backyard
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-sage/10 px-2.5 py-1 text-xs text-sage">
          <ShieldCheck className="size-3.5" /> Approved
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {["Plans", "Renders", "Spec"].map((t) => (
          <div
            key={t}
            className="rounded-lg border border-border bg-surface-2 px-3 py-4 text-center text-xs text-muted transition-all duration-300 hover:border-border-bright hover:bg-surface-3"
          >
            {t}
          </div>
        ))}
      </div>
      <div className="mt-auto rounded-xl border border-border-bright bg-surface-2 p-4 transition-all duration-300 hover:border-copper">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Design deposit</span>
          <span className="font-display text-xl text-foreground">$8,500</span>
        </div>
        <button
          type="button"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-copper py-3 text-sm font-semibold text-ink transition-all duration-300 ease-out hover:bg-copper-bright hover:scale-[1.02]"
        >
          <Lock className="size-4" />
          Pay deposit & start build
        </button>
      </div>
    </div>
  );
}
