"use client";

import Link from "next/link";
import {
  CreditCard,
  FileCheck,
  Image as ImageIcon,
  MapPinned,
  MessagesSquare,
  PencilRuler,
  type LucideIcon,
  ArrowRight,
  Zap,
  Shield,
} from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/Reveal";

type Feature = {
  icon: LucideIcon;
  title: string;
  body: string;
  stat: string;
  statLabel: string;
  size?: "large" | "medium" | "small";
};

const features: Feature[] = [
  {
    icon: MessagesSquare,
    title: "Conversational design",
    body: "No CAD, no menus. Brief Atelier in plain language and watch it build the plan around your constraints in real-time.",
    stat: "30 sec",
    statLabel: "to first-pass floor plan",
    size: "large",
  },
  {
    icon: PencilRuler,
    title: "Code-aware floor plans",
    body: "Every wall you move re-runs egress, ceiling spans, and stair geometry against the local code edition automatically.",
    stat: "100%",
    statLabel: "edits code-checked",
    size: "medium",
  },
  {
    icon: MapPinned,
    title: "Parcel & zoning fit",
    body: "Pull the client&apos;s real lot from county GIS. Atelier draws setbacks, easements, and the buildable envelope.",
    stat: "3,100+",
    statLabel: "jurisdictions mapped",
    size: "medium",
  },
  {
    icon: ImageIcon,
    title: "Photoreal renders",
    body: "Materials, daylight, and landscaping resolved into renders your client will actually fall in love with.",
    stat: "6 renders",
    statLabel: "per design, every angle",
    size: "small",
  },
  {
    icon: CreditCard,
    title: "Client portal & deposits",
    body: "A branded portal where clients review, approve, and pay the deposit in a single click.",
    stat: "1 click",
    statLabel: "approval to deposit",
    size: "small",
  },
  {
    icon: FileCheck,
    title: "Permit-ready exports",
    body: "Generate a coordinated sheet set the moment the design is signed — DWG, PDF, IFC formats your team expects.",
    stat: "DWG · PDF · IFC",
    statLabel: "exports on demand",
    size: "small",
  },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 border-t border-border py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Section header */}
        <Reveal className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border-bright bg-surface/80 px-4 py-2 text-sm">
            <Zap className="size-4 text-copper" />
            <span className="text-muted">Powerful features, simple interface</span>
          </div>
          <h2 className="mt-6 font-display text-3xl tracking-tight sm:text-4xl lg:text-5xl">
            Everything between &ldquo;I want a house&rdquo; and a{" "}
            <span className="text-gradient-copper">building permit</span>
          </h2>
          <p className="mt-5 text-lg text-muted">
            Atelier collapses the entire design phase into one tool — drafting,
            zoning, visualization, and the paperwork that gets you paid.
          </p>
        </Reveal>

        {/* Bento grid */}
        <div className="mt-16">
          <RevealGroup className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Large feature card - spans 2 columns */}
            <RevealItem className="lg:col-span-2">
              <FeatureCard feature={features[0]} variant="large" />
            </RevealItem>

            {/* Medium feature cards */}
            <RevealItem>
              <FeatureCard feature={features[1]} variant="medium" />
            </RevealItem>
            <RevealItem>
              <FeatureCard feature={features[2]} variant="medium" />
            </RevealItem>

            {/* Small feature cards - 3 in a row */}
            <RevealItem>
              <FeatureCard feature={features[3]} variant="small" />
            </RevealItem>
            <RevealItem>
              <FeatureCard feature={features[4]} variant="small" />
            </RevealItem>
            <RevealItem>
              <FeatureCard feature={features[5]} variant="small" />
            </RevealItem>
          </RevealGroup>
        </div>

        {/* Bottom CTA */}
        <Reveal delay={0.3} className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 rounded-full border border-border bg-surface px-6 py-3">
            <Shield className="size-5 text-sage" />
            <span className="text-sm text-muted">
              Enterprise-grade security. SOC 2 Type II compliant.
            </span>
            <Link
              href="/#pricing"
              className="flex items-center gap-1 text-sm font-medium text-copper hover:text-copper-bright transition-colors"
            >
              Learn more <ArrowRight className="size-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FeatureCard({
  feature,
  variant,
}: {
  feature: Feature;
  variant: "large" | "medium" | "small";
}) {
  const { icon: Icon, title, body, stat, statLabel } = feature;

  if (variant === "large") {
    return (
      <article className="group relative h-full overflow-hidden rounded-2xl border border-border bg-surface p-8 transition-all duration-300 hover:border-border-bright lg:p-10">
        {/* Background gradient */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-copper/10 blur-3xl transition-all duration-500 group-hover:bg-copper/20" />

        <div className="relative flex h-full flex-col lg:flex-row lg:items-center lg:gap-12">
          <div className="flex-1">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-border-bright bg-surface-2 text-copper transition-all duration-300 group-hover:border-copper group-hover:bg-copper/10">
              <Icon className="size-7" />
            </div>

            <h3 className="mt-6 font-display text-2xl tracking-tight lg:text-3xl">
              {title}
            </h3>
            <p className="mt-3 text-base leading-relaxed text-muted lg:text-lg">
              {body}
            </p>
          </div>

          <div className="mt-8 flex items-center gap-8 border-t border-border pt-8 lg:mt-0 lg:flex-col lg:items-end lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
            <div className="text-right lg:text-right">
              <div className="font-display text-4xl tracking-tight text-copper lg:text-5xl">
                {stat}
              </div>
              <div className="mt-1 text-sm text-muted-2">{statLabel}</div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (variant === "medium") {
    return (
      <article className="group relative h-full overflow-hidden rounded-2xl border border-border bg-surface p-7 transition-all duration-300 hover:border-border-bright">
        <div className="flex size-12 items-center justify-center rounded-xl border border-border-bright bg-surface-2 text-copper transition-all duration-300 group-hover:border-copper group-hover:bg-copper/10">
          <Icon className="size-6" />
        </div>

        <h3 className="mt-5 font-display text-xl tracking-tight">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {body}
        </p>

        <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
          <div className="font-display text-2xl tracking-tight text-copper">
            {stat}
          </div>
          <div className="text-xs text-muted-2">{statLabel}</div>
        </div>
      </article>
    );
  }

  return (
    <article className="group relative h-full overflow-hidden rounded-2xl border border-border bg-surface p-6 transition-all duration-300 hover:border-border-bright">
      <div className="flex items-start justify-between gap-4">
        <div className="flex size-10 items-center justify-center rounded-lg border border-border-bright bg-surface-2 text-copper transition-all duration-300 group-hover:border-copper group-hover:bg-copper/10">
          <Icon className="size-5" />
        </div>
        <div className="text-right">
          <div className="font-display text-xl tracking-tight text-copper">
            {stat}
          </div>
          <div className="text-[10px] text-muted-2">{statLabel}</div>
        </div>
      </div>

      <h3 className="mt-4 font-display text-lg tracking-tight">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {body}
      </p>
    </article>
  );
}
