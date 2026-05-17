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
    body: "No CAD, no menus. Brief Atelier in sentences and it builds the layout around the dimensions and materials you name.",
    stat: "30 sec",
    statLabel: "to a first-pass layout",
    steps: ["Brief", "Generate", "Iterate"],
  },
  {
    icon: PencilRuler,
    title: "Site-true layouts",
    body: "Every layout is scaled to the real yard — setbacks for pools and structures, slope, and drainage fall built in.",
    stat: "100%",
    statLabel: "of layouts scaled to the lot",
    steps: ["Draw", "Validate", "Lock"],
  },
  {
    icon: MapPinned,
    title: "Parcel & site fit",
    body: "Pull the client's real lot from county GIS. Atelier draws the property line, structures, and the usable yard.",
    stat: "3,100+",
    statLabel: "jurisdictions mapped",
    steps: ["Locate", "Apply rules", "Fit design"],
  },
  {
    icon: ImageIcon,
    title: "Photoreal renders",
    body: "Pavers, plantings, daylight, and water resolved into renders your client will actually fall for.",
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
    title: "Estimate & material takeoff",
    body: "The moment the design is signed, Atelier generates a line-item estimate and a material takeoff — pavers, base, concrete, by the square foot.",
    stat: "By the sq ft",
    statLabel: "estimates on demand",
    steps: ["Take off", "Price", "Send"],
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
            Everything between &ldquo;I want a new backyard&rdquo; and a paid deposit
          </h2>
          <p className="mt-4 text-muted">
            Atelier collapses the design phase into one tool — layout,
            materials, photoreal visuals, the estimate, and the paperwork
            that gets you paid.
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
