import {
  Box,
  Brain,
  Check,
  CreditCard,
  Files,
  Image as ImageIcon,
  Layers,
  MapPin,
  MapPinned,
  MessagesSquare,
  MonitorSmartphone,
  PencilRuler,
  PenTool,
  Ruler,
  ScrollText,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Reveal, RevealGroup, RevealItem } from "@/components/Reveal";

type Node = {
  icon: LucideIcon;
  title: string;
  body: string;
};

/** What you hand Atelier — the raw material of a custom home. */
const inputs: Node[] = [
  {
    icon: MessagesSquare,
    title: "Client brief",
    body: "Calls, emails, a plain-language wishlist",
  },
  {
    icon: MapPin,
    title: "The parcel",
    body: "A street address or APN — nothing else",
  },
  {
    icon: Layers,
    title: "Zoning & GIS",
    body: "Setbacks, easements, overlays from county data",
  },
  {
    icon: ScrollText,
    title: "Building code",
    body: "Local edition — egress, spans, stair geometry",
  },
  {
    icon: Ruler,
    title: "Program & budget",
    body: "Square footage, bed count, the must-haves",
  },
  {
    icon: ImageIcon,
    title: "Inspiration",
    body: "Reference photos, styles, materials",
  },
];

/** What Atelier hands back — a fundable design package. */
const outputs: Node[] = [
  {
    icon: PencilRuler,
    title: "Permit-ready floor plans",
    body: "Code-checked walls, egress, and dimensions",
  },
  {
    icon: MapPinned,
    title: "Site plan on the real lot",
    body: "Plan fitted inside the buildable envelope",
  },
  {
    icon: ImageIcon,
    title: "Photoreal renders",
    body: "Six angles, resolved materials and daylight",
  },
  {
    icon: Files,
    title: "Coordinated sheet sets",
    body: "DWG · PDF · IFC, the formats drafting expects",
  },
  {
    icon: MonitorSmartphone,
    title: "Branded client portal",
    body: "Review, sign-off, and approval in one link",
  },
  {
    icon: CreditCard,
    title: "Collected design deposit",
    body: "The client pays before they cool off",
  },
];

/** The reasoning Atelier runs in the middle. */
const capabilities = [
  "Read a plain-language brief",
  "Generate a code-aware floor plan",
  "Check setbacks, easements & zoning",
  "Resolve materials into photoreal renders",
  "Assemble a permit-ready sheet set",
  "Re-validate every edit against code",
];

/** How Atelier carries the whole design phase. */
const powers: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: PenTool,
    title: "Design",
    body: "A brief becomes a floor plan in one pass",
  },
  {
    icon: Ruler,
    title: "Drafting",
    body: "Code-checked, edit-ready geometry",
  },
  {
    icon: MapPinned,
    title: "Site intelligence",
    body: "Parcel, zoning & GIS resolved automatically",
  },
  {
    icon: Box,
    title: "Visualization",
    body: "Live 3D and photoreal renders",
  },
  {
    icon: Brain,
    title: "Reasoning",
    body: "Understands the code, the lot, and the build",
  },
];

function NodeCard({ icon: Icon, title, body }: Node) {
  return (
    <div className="group flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:border-border-bright">
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-border-bright bg-surface-2 text-copper transition-colors group-hover:bg-copper group-hover:text-ink">
        <Icon className="size-4" />
      </span>
      <span>
        <span className="block text-sm font-medium text-foreground">
          {title}
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted-2">
          {body}
        </span>
      </span>
    </div>
  );
}

export function Workflow() {
  return (
    <section
      id="workflow"
      className="scroll-mt-20 border-t border-border py-24"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-copper">
            The workflow
          </p>
          <h2 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">
            Describe the home in plain English. Atelier does the rest.
          </h2>
          <p className="mt-4 text-muted">
            Atelier understands the brief, reasons about the code and the lot,
            and turns one conversation into a fundable design package.
          </p>
        </Reveal>

        {/* the flow: inputs -> Atelier -> outputs */}
        <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-[1fr_minmax(0,1.15fr)_1fr]">
          {/* inputs */}
          <Reveal>
            <div className="flex h-full flex-col">
              <p className="mb-4 text-center text-[11px] font-medium uppercase tracking-[0.18em] text-muted-2">
                What you bring
              </p>
              <RevealGroup className="flex flex-col gap-3">
                {inputs.map((node) => (
                  <RevealItem key={node.title}>
                    <NodeCard {...node} />
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>
          </Reveal>

          {/* Atelier core */}
          <Reveal delay={0.1}>
            <div className="relative flex h-full flex-col rounded-card border border-border-bright bg-surface">
              {/* connector arrows, lg only */}
              <span
                aria-hidden="true"
                className="absolute left-0 top-1/2 hidden h-px w-6 -translate-x-full bg-gradient-to-r from-transparent to-copper/60 lg:block"
              />
              <span
                aria-hidden="true"
                className="absolute right-0 top-1/2 hidden h-px w-6 translate-x-full bg-gradient-to-r from-copper/60 to-transparent lg:block"
              />

              <div className="flex flex-col items-center border-b border-border bg-surface-2 px-6 py-7 text-center">
                <span className="flex size-16 items-center justify-center rounded-2xl border border-border-bright bg-ink text-copper shadow-[0_0_50px_-12px_rgba(210,138,85,0.5)]">
                  <Logo className="size-8" />
                </span>
                <h3 className="mt-4 font-display text-xl tracking-tight">
                  Atelier
                </h3>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-2">
                  Custom-home design engine
                </p>
              </div>

              <div className="flex flex-1 flex-col px-6 py-6">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-copper">
                  What it works out
                </p>
                <ul className="mt-3 space-y-2.5">
                  {capabilities.map((cap) => (
                    <li
                      key={cap}
                      className="flex items-start gap-2.5 text-sm text-muted"
                    >
                      <Check className="mt-0.5 size-4 shrink-0 text-sage" />
                      <span>{cap}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex items-center gap-2 rounded-lg border border-border bg-ink px-3 py-2.5 text-xs text-muted-2">
                  <Sparkles className="size-3.5 shrink-0 text-copper" />
                  Every edit re-runs the checks — no stale drawings.
                </div>
              </div>
            </div>
          </Reveal>

          {/* outputs */}
          <Reveal delay={0.18}>
            <div className="flex h-full flex-col">
              <p className="mb-4 text-center text-[11px] font-medium uppercase tracking-[0.18em] text-muted-2">
                What you get back
              </p>
              <RevealGroup className="flex flex-col gap-3">
                {outputs.map((node) => (
                  <RevealItem key={node.title}>
                    <NodeCard {...node} />
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>
          </Reveal>
        </div>

        {/* powers row */}
        <Reveal className="mt-16" delay={0.05}>
          <p className="text-center text-[11px] font-medium uppercase tracking-[0.18em] text-muted-2">
            Atelier carries the entire design phase
          </p>
          <RevealGroup className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {powers.map((p) => (
              <RevealItem key={p.title}>
                <div className="flex h-full flex-col rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-bright">
                  <p.icon className="size-5 text-copper" />
                  <h3 className="mt-3 font-display text-base tracking-tight">
                    {p.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-2">
                    {p.body}
                  </p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </Reveal>

        {/* tagline */}
        <Reveal className="mt-10" delay={0.1}>
          <div className="mx-auto flex max-w-3xl items-center justify-center gap-3 rounded-card border border-border-bright bg-surface px-6 py-5 text-center">
            <Sparkles className="hidden size-5 shrink-0 text-copper sm:block" />
            <p className="text-sm text-muted sm:text-base">
              Atelier doesn&apos;t just draw — it reasons about the code, the
              lot, and the build, so the design is{" "}
              <span className="text-foreground">right the first time.</span>
            </p>
          </div>
        </Reveal>

        {/* works with */}
        <Reveal className="mt-8" delay={0.12}>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-muted-2">
            <span className="uppercase tracking-[0.16em]">Works with</span>
            {[
              "County GIS",
              "MapLibre",
              "Stripe",
              "Supabase",
              "DWG / IFC export",
            ].map((tool) => (
              <span
                key={tool}
                className="rounded-full border border-border bg-surface px-2.5 py-1 text-muted"
              >
                {tool}
              </span>
            ))}
            <span>… and more</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
