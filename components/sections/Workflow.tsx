"use client";

import { ArrowRight, FileText, MapPin, DollarSign, Users, Ruler, FileCheck, Palette, CreditCard } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/Reveal";

const inputItems = [
  { icon: FileText, label: "Project description", detail: "Plain English" },
  { icon: MapPin, label: "Property address", detail: "Or a pin on the map" },
  { icon: DollarSign, label: "Budget range", detail: "Optional" },
  { icon: Users, label: "Client info", detail: "Name & contact" },
];

const outputItems = [
  { icon: Ruler, label: "Scaled layout", detail: "Code-checked" },
  { icon: FileCheck, label: "Detailed estimate", detail: "Material + labor" },
  { icon: Palette, label: "3D renders", detail: "Photo-realistic" },
  { icon: CreditCard, label: "Client portal", detail: "Sign & pay" },
];

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
            What you bring in.{" "}
            <span className="text-gradient-copper">What you get back.</span>
          </h2>
          <p className="mt-5 text-lg text-muted">
            Five minutes of input from you. A complete project package for your client.
          </p>
        </Reveal>

        {/* Input → Atelier → Output flow */}
        <div className="mt-16 lg:mt-20">
          <RevealGroup className="grid items-stretch gap-6 lg:grid-cols-[1fr_auto_1fr] lg:gap-8">
            {/* Input column */}
            <RevealItem>
              <div className="h-full rounded-2xl border border-border bg-surface p-6 transition-all duration-300 hover:border-border-bright lg:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl border border-border-bright bg-surface-2">
                    <ArrowRight className="size-5 text-muted-2" />
                  </span>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-2">
                      What you bring
                    </p>
                    <p className="font-display text-xl text-foreground">Your input</p>
                  </div>
                </div>
                <ul className="space-y-4">
                  {inputItems.map((item) => (
                    <li
                      key={item.label}
                      className="flex items-center gap-4 rounded-xl border border-border bg-surface-2 px-4 py-3 transition-all duration-300 hover:border-border-bright hover:bg-surface-3"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-ink-2">
                        <item.icon className="size-5 text-muted" />
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

            {/* Center - Atelier transform */}
            <RevealItem>
              <div className="flex h-full items-center justify-center lg:px-4">
                <div className="flex flex-col items-center gap-4">
                  {/* Connection line - top */}
                  <div className="hidden h-12 w-px bg-gradient-to-b from-transparent via-copper/50 to-copper lg:block" />
                  
                  {/* Atelier badge */}
                  <div className="relative">
                    <div className="absolute -inset-4 rounded-full bg-copper/10 blur-xl" />
                    <div className="relative flex flex-col items-center gap-2 rounded-2xl border border-copper bg-surface-2 px-8 py-6 shadow-[0_0_40px_rgba(212,165,116,0.15)]">
                      <div className="flex size-12 items-center justify-center rounded-xl bg-copper/20">
                        <svg className="size-6 text-copper" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                          <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                      </div>
                      <span className="font-display text-lg text-copper">Atelier</span>
                      <span className="text-xs text-muted-2">processes in seconds</span>
                    </div>
                  </div>

                  {/* Connection line - bottom */}
                  <div className="hidden h-12 w-px bg-gradient-to-b from-copper to-copper/50 lg:block" />

                  {/* Mobile arrows */}
                  <div className="flex items-center gap-2 lg:hidden">
                    <div className="h-px w-8 bg-gradient-to-r from-transparent to-copper" />
                    <ArrowRight className="size-5 text-copper" />
                    <div className="h-px w-8 bg-gradient-to-r from-copper to-transparent" />
                  </div>
                </div>
              </div>
            </RevealItem>

            {/* Output column */}
            <RevealItem>
              <div className="h-full rounded-2xl border border-copper/30 bg-gradient-to-br from-copper/5 to-transparent p-6 transition-all duration-300 hover:border-copper/50 lg:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl border border-copper/40 bg-copper/10">
                    <ArrowRight className="size-5 text-copper" />
                  </span>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-copper">
                      What you get
                    </p>
                    <p className="font-display text-xl text-foreground">Full package</p>
                  </div>
                </div>
                <ul className="space-y-4">
                  {outputItems.map((item) => (
                    <li
                      key={item.label}
                      className="flex items-center gap-4 rounded-xl border border-copper/20 bg-surface px-4 py-3 transition-all duration-300 hover:border-copper/40 hover:bg-surface-2"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-copper/10">
                        <item.icon className="size-5 text-copper" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-copper-muted">{item.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </RevealItem>
          </RevealGroup>
        </div>

        {/* Bottom stat */}
        <Reveal className="mt-12 text-center">
          <p className="text-sm text-muted">
            Average time from address to signed proposal:{" "}
            <span className="font-display text-xl text-copper">12 minutes</span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
