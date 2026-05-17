import { Check, TrendingUp } from "lucide-react";
import { CountUp } from "@/components/CountUp";
import { Reveal } from "@/components/Reveal";

type LineItem = {
  label: string;
  detail: string;
  amount: number;
  negative?: boolean;
};

const lineItems: LineItem[] = [
  {
    label: "Paid design consultations",
    detail: "22 measure visits × $300 — the measure visit now bills",
    amount: 6600,
  },
  {
    label: "Job deposits collected",
    detail: "14 signed-off designs × $6,500 in-portal",
    amount: 91000,
  },
  {
    label: "Upgrade upsells",
    detail: "Fire features, lighting, and material upgrades added on the render",
    amount: 11400,
  },
  {
    label: "Outsourced rendering, eliminated",
    detail: "No more $250/design to a freelance 3D artist",
    amount: 3500,
  },
  {
    label: "Atelier Studio subscription",
    detail: "Your all-in monthly plan",
    amount: 349,
    negative: true,
  },
];

const total = lineItems.reduce(
  (sum, item) => sum + (item.negative ? -item.amount : item.amount),
  0,
);

const copyPoints = [
  "The design phase used to be a cost center — evenings spent hand-drawing a sketch before a single dollar came in.",
  "Atelier flips it. The measure visit bills, the render lands on-site, and the deposit clears before the client cools off.",
  "One contractor, no new hires. The numbers on the right are a single estimator's month.",
];

export function TheMath() {
  return (
    <section id="math" className="scroll-mt-20 border-t border-border py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* left — copy */}
          <Reveal>
            <p className="text-xs uppercase tracking-[0.2em] text-copper">
              The math
            </p>
            <h2 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">
              The design phase should make money, not cost it
            </h2>
            <div className="mt-6 space-y-4">
              {copyPoints.map((p) => (
                <p key={p} className="flex gap-3 text-muted leading-relaxed">
                  <Check className="mt-1 size-4 shrink-0 text-copper" />
                  <span>{p}</span>
                </p>
              ))}
            </div>
            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm text-muted">
              <TrendingUp className="size-4 text-sage" />
              Modeled on the median Atelier Studio account, month four
            </div>
          </Reveal>

          {/* right — revenue widget */}
          <Reveal delay={0.12}>
            <div className="rounded-card border border-border-bright bg-surface">
              <div className="border-b border-border px-6 py-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-2">
                  Monthly revenue, one contractor
                </p>
              </div>

              <ul className="divide-y divide-border">
                {lineItems.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-start justify-between gap-4 px-6 py-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {item.label}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-2">
                        {item.detail}
                      </p>
                    </div>
                    <div
                      className={`shrink-0 font-display text-lg tracking-tight ${
                        item.negative ? "text-muted" : "text-foreground"
                      }`}
                    >
                      <CountUp
                        to={item.amount}
                        prefix={item.negative ? "−$" : "+$"}
                        separator
                      />
                    </div>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between gap-4 border-t border-border-bright bg-surface-2 px-6 py-5">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Net new monthly revenue
                  </p>
                  <p className="mt-0.5 text-xs text-muted-2">
                    Added to the top line, every month
                  </p>
                </div>
                <div className="font-display text-3xl tracking-tight text-copper sm:text-4xl">
                  <CountUp to={total} prefix="$" separator duration={2.2} />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
