import {
  CreditCard,
  FileCheck,
  Image as ImageIcon,
  MapPinned,
  MessagesSquare,
  PencilRuler,
  type LucideIcon,
} from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/Reveal";

type Feature = {
  icon: LucideIcon;
  title: string;
  body: string;
  stat: string;
  statLabel: string;
  steps: [string, string, string];
};

const features: Feature[] = [
  {
    icon: MessagesSquare,
    title: "Conversational design",
    body: "No CAD, no menus. Brief Atelier in sentences and it builds the plan around the constraints you name.",
    stat: "30 sec",
    statLabel: "to a first-pass floor plan",
    steps: ["Brief", "Generate", "Iterate"],
  },
  {
    icon: PencilRuler,
    title: "Code-aware floor plans",
    body: "Every wall you move re-runs egress, ceiling spans, and stair geometry against the local code edition.",
    stat: "100%",
    statLabel: "of edits checked against code",
    steps: ["Draw", "Validate", "Lock"],
  },
  {
    icon: MapPinned,
    title: "Parcel & zoning fit",
    body: "Pull the client's real lot from county GIS. Atelier draws setbacks, easements, and the buildable envelope.",
    stat: "3,100+",
    statLabel: "jurisdictions mapped",
    steps: ["Locate", "Apply rules", "Fit plan"],
  },
  {
    icon: ImageIcon,
    title: "Photoreal renders",
    body: "Materials, daylight, and landscaping resolved into renders your client will actually fall for.",
    stat: "6 renders",
    statLabel: "per design, every angle",
    steps: ["Materials", "Light", "Render"],
  },
  {
    icon: CreditCard,
    title: "Client portal & deposits",
    body: "A branded portal where clients review the design, sign off, and pay the deposit in a single click.",
    stat: "1 click",
    statLabel: "from approval to deposit",
    steps: ["Share", "Approve", "Get paid"],
  },
  {
    icon: FileCheck,
    title: "Permit-ready exports",
    body: "Generate a coordinated sheet set the moment the design is signed — formats your draftsperson expects.",
    stat: "DWG · PDF · IFC",
    statLabel: "exports on demand",
    steps: ["Sheet set", "Review", "Export"],
  },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 border-t border-border py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-copper">
            Features
          </p>
          <h2 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">
            Everything between &ldquo;I want a house&rdquo; and a building permit
          </h2>
          <p className="mt-4 text-muted">
            Atelier collapses the design phase into one tool — drafting,
            zoning, visualization, and the paperwork that gets you paid.
          </p>
        </Reveal>

        <RevealGroup className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <RevealItem key={f.title}>
              <article className="group flex h-full flex-col rounded-card border border-border bg-surface p-6 transition-colors hover:border-border-bright">
                <div className="flex size-11 items-center justify-center rounded-xl border border-border-bright bg-surface-2 text-copper transition-colors group-hover:bg-copper group-hover:text-ink">
                  <f.icon className="size-5" />
                </div>

                <h3 className="mt-5 font-display text-xl tracking-tight">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {f.body}
                </p>

                <div className="mt-5">
                  <div className="font-display text-3xl tracking-tight text-copper">
                    {f.stat}
                  </div>
                  <div className="text-xs text-muted-2">{f.statLabel}</div>
                </div>

                <div className="mt-5 flex items-center gap-2 border-t border-border pt-4">
                  {f.steps.map((step, i) => (
                    <div key={step} className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 text-[11px] text-muted">
                        <span className="grid size-4 place-items-center rounded-full bg-surface-3 text-[9px] text-copper">
                          {i + 1}
                        </span>
                        {step}
                      </span>
                      {i < f.steps.length - 1 && (
                        <span className="h-px w-3 bg-border-bright" />
                      )}
                    </div>
                  ))}
                </div>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
