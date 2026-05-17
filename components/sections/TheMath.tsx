"use client";

import { Check, TrendingUp, ArrowUpRight, DollarSign } from "lucide-react";
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
    detail: "22 measure visits \u00d7 $300 \u2014 the measure visit now bills",
    amount: 6600,
  },
  {
    label: "Job deposits collected",
    detail: "14 signed-off designs \u00d7 $6,500 in-portal",
    amount: 91000,
  },
  {
    label: "Upgrade upsells",
    detail: "Fire features, lighting, and material upgrades added on the render",
    amount: 8400,
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

const benefits = [
  "The design phase used to be a cost center \u2014 evenings spent hand-drawing a sketch before a single dollar came in.",
  "Atelier flips it. The measure visit bills, the render lands on-site, and the deposit clears before the client cools off.",
  "One contractor, no new hires. The numbers on the right are a single estimator\u2019s month.",
];

export function TheMath() {
  return (
    <section id="math" className="scroll-mt-20 border-t border-border py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Left - copy */}
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-border-bright bg-surface/80 px-4 py-2 text-sm">
              <TrendingUp className="size-4 text-sage" />
              <span className="text-muted">ROI calculator</span>
            </div>
            <h2 className="mt-6 font-display text-3xl tracking-tight sm:text-4xl lg:text-5xl">
              The design phase should{" "}
              <span className="text-gradient-copper">make money</span>,{" "}
              not cost it
            </h2>
            <div className="mt-8 space-y-5">
              {benefits.map((p) => (
                <p key={p} className="flex gap-4 text-base text-muted leading-relaxed">
                  <Check className="mt-1 size-5 shrink-0 text-copper" />
                  <span>{p}</span>
                </p>
              ))}
            </div>
            <div className="mt-10 inline-flex items-center gap-3 rounded-xl border border-border bg-surface px-5 py-3.5">
              <DollarSign className="size-5 text-copper" />
              <span className="text-sm text-muted">
                Modeled on the median Atelier Studio account, month four
              </span>
            </div>
          </Reveal>

          {/* Right - revenue widget */}
          <Reveal delay={0.15}>
            <div className="overflow-hidden rounded-2xl border border-border bg-surface">
              <div className="border-b border-border bg-surface-2 px-6 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-2">
                    Monthly revenue, one contractor
                  </p>
                  <ArrowUpRight className="size-4 text-sage" />
                </div>
              </div>

              <ul className="divide-y divide-border">
                {lineItems.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-start justify-between gap-4 px-6 py-5 transition-colors hover:bg-surface-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {item.label}
                      </p>
                      <p className="mt-1 text-xs text-muted-2">
                        {item.detail}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "shrink-0 font-display text-xl tracking-tight",
                        item.negative ? "text-muted-2" : "text-foreground"
                      )}
                    >
                      <CountUp
                        to={item.amount}
                        prefix={item.negative ? "-$" : "+$"}
                        separator
                      />
                    </div>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between gap-4 border-t border-copper/30 bg-copper/5 px-6 py-6">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Net new monthly revenue
                  </p>
                  <p className="mt-1 text-xs text-muted-2">
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

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
