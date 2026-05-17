import Link from "next/link";
import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/Reveal";
import { cn } from "@/lib/utils";

type Tier = {
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  cta: string;
  href: string;
  featured?: boolean;
  features: string[];
};

const tiers: Tier[] = [
  {
    name: "Solo",
    price: "$49",
    cadence: "/ month",
    blurb: "For the independent designer testing the water.",
    cta: "Start free",
    href: "/builder",
    features: [
      "5 home designs / month",
      "Floor plans + 2 renders each",
      "Parcel & zoning fit",
      "PDF sheet exports",
      "1 seat",
    ],
  },
  {
    name: "Studio",
    price: "$349",
    cadence: "/ month",
    blurb: "For the working builder running real projects.",
    cta: "Start free",
    href: "/builder",
    featured: true,
    features: [
      "Unlimited home designs",
      "6 photoreal renders per design",
      "Branded client portal + deposits",
      "DWG · PDF · IFC exports",
      "Code validation, all jurisdictions",
      "5 seats included",
    ],
  },
  {
    name: "Firm",
    price: "Custom",
    cadence: "",
    blurb: "For multi-office practices and production builders.",
    cta: "Talk to sales",
    href: "/builder",
    features: [
      "Everything in Studio",
      "Unlimited seats + SSO",
      "API & CRM integrations",
      "Custom code rule packs",
      "Dedicated success manager",
      "Onboarding & SLA",
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 border-t border-border py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-copper">
            Pricing
          </p>
          <h2 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">
            One signed deposit pays for the year
          </h2>
          <p className="mt-4 text-muted">
            Every plan is free for your first three designs. No card up front,
            no per-render metering.
          </p>
        </Reveal>

        <RevealGroup className="mt-14 grid items-start gap-6 lg:grid-cols-3">
          {tiers.map((tier) => (
            <RevealItem key={tier.name}>
              <div
                className={cn(
                  "relative flex h-full flex-col rounded-card border bg-surface p-7",
                  tier.featured
                    ? "border-copper shadow-[0_0_0_1px_rgba(210,138,85,0.35),0_30px_80px_-40px_rgba(210,138,85,0.45)] lg:-mt-4 lg:mb-4"
                    : "border-border",
                )}
              >
                {tier.featured && (
                  <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-copper px-3 py-1 text-xs font-semibold text-ink">
                    <Star className="size-3 fill-ink" />
                    Most Popular
                  </span>
                )}

                <h3 className="font-display text-xl tracking-tight">
                  {tier.name}
                </h3>
                <p className="mt-1 text-sm text-muted">{tier.blurb}</p>

                <div className="mt-5 flex items-baseline gap-1">
                  <span className="font-display text-4xl tracking-tight">
                    {tier.price}
                  </span>
                  {tier.cadence && (
                    <span className="text-sm text-muted-2">{tier.cadence}</span>
                  )}
                </div>

                <Button
                  asChild
                  variant={tier.featured ? "primary" : "subtle"}
                  className="mt-6 w-full"
                >
                  <Link href={tier.href}>{tier.cta}</Link>
                </Button>

                <ul className="mt-7 space-y-3 border-t border-border pt-6">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-sm text-muted"
                    >
                      <Check
                        className={cn(
                          "mt-0.5 size-4 shrink-0",
                          tier.featured ? "text-copper" : "text-sage",
                        )}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
