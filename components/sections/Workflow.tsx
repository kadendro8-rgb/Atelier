"use client";

import {
  FileText,
  MapPin,
  Scale,
  BookOpen,
  LayoutDashboard,
  Camera,
  Sparkles,
  Check,
  Ruler,
  Map,
  Eye,
  Brain,
  FileCheck,
  CreditCard,
  Globe,
} from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/Reveal";

const inputItems = [
  { icon: FileText, label: "Client brief", detail: "Calls, emails, a plain-language wishlist" },
  { icon: MapPin, label: "The parcel", detail: "A street address or APN \u2014 nothing else" },
  { icon: Scale, label: "Zoning & GIS", detail: "Setbacks, easements, overlays from county data" },
  { icon: BookOpen, label: "Building code", detail: "Local edition \u2014 egress, spans, stair geometry" },
  { icon: LayoutDashboard, label: "Program & budget", detail: "Square footage, bed count, the must-haves" },
  { icon: Camera, label: "Inspiration", detail: "Reference photos, styles, materials" },
];

const engineSteps = [
  { icon: FileText, label: "Read a plain-language brief" },
  { icon: Ruler, label: "Generate a code-aware floor plan" },
  { icon: Map, label: "Check setbacks, easements & zoning" },
  { icon: Eye, label: "Resolve materials into photoreal renders" },
  { icon: FileCheck, label: "Assemble a permit-ready sheet set" },
  { icon: Brain, label: "Re-validate every edit against code" },
];

const outputItems = [
  { icon: Ruler, label: "Permit-ready floor plans", detail: "Code-checked walls, egress, and dimensions" },
  { icon: Map, label: "Site plan on the real lot", detail: "Plan fitted inside the buildable envelope" },
  { icon: Eye, label: "Photoreal renders", detail: "Six angles, resolved materials and daylight" },
  { icon: FileCheck, label: "Coordinated sheet sets", detail: "DWG \u00b7 PDF \u00b7 IFC, the formats drafting expects" },
  { icon: Globe, label: "Branded client portal", detail: "Review, sign-off, and approval in one link" },
  { icon: CreditCard, label: "Collected design deposit", detail: "The client pays before they cool off" },
];

const capabilities = [
  { icon: Ruler, title: "Design", body: "A brief becomes a floor plan in one pass" },
  { icon: FileCheck, title: "Drafting", body: "Code-checked, edit-ready geometry" },
  { icon: Map, title: "Site intelligence", body: "Parcel, zoning & GIS resolved automatically" },
  { icon: Eye, title: "Visualization", body: "Live 3D and photoreal renders" },
  { icon: Brain, title: "Reasoning", body: "Understands the code, the lot, and the build" },
];

const integrations = ["County GIS", "MapLibre", "Stripe", "Supabase", "DWG / IFC export", "\u2026 and more"];

export function Workflow() {
  return (
    <section id="workflow" className="scroll-mt-20 border-t border-border py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Section header */}
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-copper">
            The Workflow
          </p>
          <h2 className="mt-4 font-display text-3xl tracking-tight sm:text-4xl lg:text-5xl">
            Describe the home in plain English.{" "}
            <span className="text-gradient-copper">Atelier does the rest.</span>
          </h2>
          <p className="mt-5 text-lg text-muted">
            Atelier understands the brief, reasons about the code and the lot,
            and turns one conversation into a fundable design package.
          </p>
        </Reveal>

        {/* Three-column flow: Input -> Engine -> Output */}
        <div className="mt-16 lg:mt-20">
          <RevealGroup className="grid items-start gap-8 lg:grid-cols-[1fr_auto_1fr]">
            {/* WHAT YOU BRING */}
            <RevealItem>
              <div className="h-full">
                <p className="mb-6 text-xs font-medium uppercase tracking-[0.2em] text-muted-2">
                  What you bring
                </p>
                <ul className="space-y-3">
                  {inputItems.map((item) => (
                    <li
                      key={item.label}
                      className="flex items-start gap-4 rounded-xl border border-border bg-surface px-4 py-3.5 transition-all duration-300 hover:border-border-bright hover:bg-surface-2"
                    >
                      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-2">
                        <item.icon className="size-4 text-muted" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-2">{item.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </RevealItem>

            {/* ATELIER ENGINE (center) */}
            <RevealItem>
              <div className="flex flex-col items-center lg:pt-8">
                {/* Connection line top */}
                <div className="hidden h-8 w-px bg-gradient-to-b from-transparent to-copper/40 lg:block" />

                <div className="relative w-full max-w-xs">
                  <div className="absolute -inset-3 rounded-3xl bg-copper/8 blur-2xl" />
                  <div className="relative overflow-hidden rounded-2xl border border-copper/40 bg-surface">
                    {/* Engine header */}
                    <div className="border-b border-copper/20 bg-copper/5 px-6 py-4 text-center">
                      <h3 className="font-display text-lg text-copper">Atelier</h3>
                      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-2">
                        Custom-home design engine
                      </p>
                    </div>

                    {/* What it works out */}
                    <div className="p-5">
                      <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-2">
                        What it works out
                      </p>
                      <ul className="space-y-2.5">
                        {engineSteps.map((step) => (
                          <li
                            key={step.label}
                            className="flex items-center gap-3 text-xs text-muted"
                          >
                            <step.icon className="size-3.5 shrink-0 text-copper" />
                            <span>{step.label}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Bottom note */}
                    <div className="border-t border-border bg-surface-2 px-5 py-3">
                      <p className="flex items-center gap-2 text-[11px] text-muted-2">
                        <Sparkles className="size-3.5 text-copper" />
                        Every edit re-runs the checks — no stale drawings.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Connection line bottom */}
                <div className="hidden h-8 w-px bg-gradient-to-b from-copper/40 to-transparent lg:block" />
              </div>
            </RevealItem>

            {/* WHAT YOU GET BACK */}
            <RevealItem>
              <div className="h-full">
                <p className="mb-6 text-xs font-medium uppercase tracking-[0.2em] text-copper">
                  What you get back
                </p>
                <ul className="space-y-3">
                  {outputItems.map((item) => (
                    <li
                      key={item.label}
                      className="flex items-start gap-4 rounded-xl border border-copper/20 bg-gradient-to-r from-copper/5 to-transparent px-4 py-3.5 transition-all duration-300 hover:border-copper/40"
                    >
                      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-copper/10">
                        <item.icon className="size-4 text-copper" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-2">{item.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </RevealItem>
          </RevealGroup>
        </div>

        {/* ATELIER CARRIES THE ENTIRE DESIGN PHASE */}
        <Reveal className="mt-20">
          <p className="mb-8 text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-2">
            Atelier carries the entire design phase
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {capabilities.map((cap) => (
              <div
                key={cap.title}
                className="rounded-xl border border-border bg-surface p-5 text-center transition-all duration-300 hover:border-border-bright hover:bg-surface-2"
              >
                <div className="mx-auto flex size-10 items-center justify-center rounded-lg bg-surface-2">
                  <cap.icon className="size-5 text-copper" />
                </div>
                <h3 className="mt-3 font-display text-base tracking-tight">{cap.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{cap.body}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Bottom callout + integrations */}
        <Reveal className="mt-12">
          <div className="rounded-2xl border border-border bg-surface p-6 lg:p-8">
            <div className="flex flex-col items-center gap-6 lg:flex-row">
              <div className="flex items-start gap-4 lg:flex-1">
                <Sparkles className="mt-1 size-6 shrink-0 text-copper" />
                <p className="text-base leading-relaxed text-muted">
                  Atelier doesn&apos;t just draw — it reasons about the code, the lot,
                  and the build, so the design is right the first time.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 lg:shrink-0">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-2">
                  Works with
                </span>
                {integrations.map((name) => (
                  <span
                    key={name}
                    className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs text-muted"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
