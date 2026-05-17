"use client";

import Link from "next/link";
import { Check, Sparkles, Building2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/Reveal";
import { cn } from "@/lib/utils";

type Tier = {
  name: string;
  icon: typeof Sparkles;
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
    icon: Sparkles,
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
    icon: Building2,
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
      "DWG \u00b7 PDF \u00b7 IFC exports",
      "Code validation, all jurisdictions",
      "5 seats included",
    ],
  },
  {
    name: "Firm",
    icon: Users,
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
    <section id="pricing" className="scroll-mt-20 border-t border-border py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Section header */}
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-copper">
            Pricing
          </p>
          <h2 className="mt-4 font-display text-3xl tracking-tight sm:text-4xl lg:text-5xl">
            One signed deposit{" "}
            <span className="text-gradient-copper">pays for the year</span>
          </h2>
          <p className="mt-5 text-lg text-muted">
            Every plan is free for your first three designs. No card up front,
            no per-render metering.
          </p>
        </Reveal>

        {/* Pricing cards */}
        <RevealGroup className="mt-16 grid items-start gap-6 lg:grid-cols-3">
          {tiers.map((tier) => (
            <RevealItem key={tier.name}>
              <div
                className={cn(
                  "relative flex h-full flex-col rounded-2xl border p-8 transition-all duration-300",
                  tier.featured
                    ? "border-copper bg-surface glow-copper lg:-mt-4 lg:mb-4 lg:p-10"
                    : "border-border bg-surface hover:border-border-bright",
                )}
              >
                {tier.featured && (
                  <span className="absolute -top-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-copper px-4 py-1.5 text-sm font-semibold text-ink">
                    <Sparkles className="size-4" />
                    Most Popular
                  </span>
                )}

                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex size-12 items-center justify-center rounded-xl",
                    tier.featured 
                      ? "bg-copper/20 text-copper" 
                      : "bg-surface-2 text-muted"
                  )}>
                    <tier.icon className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl tracking-tight">
                      {tier.name}
                    </h3>
                    <p className="text-sm text-muted-2">{tier.blurb}</p>
                  </div>
                </div>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-display text-5xl tracking-tight">
                    {tier.price}
                  </span>
                  {tier.cadence && (
                    <span className="text-base text-muted-2">{tier.cadence}</span>
                  )}
                </div>

                <Button
                  asChild
                  variant={tier.featured ? "primary" : "outline"}
                  size="lg"
                  className="mt-8 w-full"
                >
                  <Link href={tier.href}>{tier.cta}</Link>
                </Button>

                <ul className="mt-8 space-y-4 border-t border-border pt-8">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm text-muted"
                    >
                      <Check
                        className={cn(
                          "mt-0.5 size-5 shrink-0",
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

        {/* Trust badges */}
        <Reveal delay={0.3} className="mt-16 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-6 text-sm text-muted-2">
            <span className="flex items-center gap-2">
              <Check className="size-4 text-sage" />
              No credit card required
            </span>
            <span className="flex items-center gap-2">
              <Check className="size-4 text-sage" />
              Cancel anytime
            </span>
            <span className="flex items-center gap-2">
              <Check className="size-4 text-sage" />
              SOC 2 compliant
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
