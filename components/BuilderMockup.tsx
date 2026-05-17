"use client";

import { useState } from "react";
import { ArrowRight, MapPin, Check, Home, Fence, Plus, Dumbbell, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const buildingTypes = [
  { id: "custom-home", label: "Custom Home", icon: Home, available: true },
  { id: "hardscape", label: "Hardscape & Backyard", icon: Fence, available: true },
  { id: "room", label: "Room & Addition", icon: Plus, available: false },
  { id: "garage", label: "Garage", icon: Car, available: false },
  { id: "gym", label: "Home Gym", icon: Dumbbell, available: false },
];

const contextSteps = [
  "Site the lot from public mapping data",
  "Describe the project in plain language",
  "Generate a code-checked plan",
  "Review, render, and share a portal",
];

export function BuilderMockup() {
  const [selected, setSelected] = useState("custom-home");
  const [address, setAddress] = useState("");

  const selectedType = buildingTypes.find((t) => t.id === selected);

  return (
    <div className="relative mx-auto max-w-5xl">
      {/* Browser chrome mockup */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/30">
        {/* Browser address bar */}
        <div className="flex items-center gap-3 border-b border-border bg-surface-2 px-4 py-3">
          <div className="flex gap-1.5">
            <div className="size-3 rounded-full bg-border-bright transition-colors duration-300 hover:bg-muted-2" />
            <div className="size-3 rounded-full bg-border-bright transition-colors duration-300 hover:bg-muted-2" />
            <div className="size-3 rounded-full bg-border-bright transition-colors duration-300 hover:bg-muted-2" />
          </div>
          <div className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-surface px-4 py-1.5 text-sm">
            <span className="text-muted-2">atelier.design/builder</span>
            <span className="flex items-center gap-1 rounded-full bg-sage/20 px-2 py-0.5 text-xs text-sage">
              <span className="size-1.5 rounded-full bg-sage animate-pulse" />
              Live
            </span>
          </div>
        </div>

        {/* Builder content */}
        <div className="grid gap-6 p-6 md:grid-cols-2 md:gap-8 md:p-8">
          {/* Left side - Form */}
          <div className="space-y-6">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wider text-muted-2">
                Step 0 · Start your design
              </p>
              <h3 className="font-display text-2xl tracking-tight">
                What are you building?
              </h3>
            </div>

            {/* Building type selector */}
            <div className="grid grid-cols-2 gap-2">
              {buildingTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = selected === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => type.available && setSelected(type.id)}
                    disabled={!type.available}
                    className={cn(
                      "relative flex items-center gap-2 rounded-xl border px-4 py-3 text-left text-sm transition-all duration-300",
                      isSelected
                        ? "border-copper bg-copper/10 text-foreground"
                        : type.available
                          ? "border-border bg-surface-2 text-muted hover:border-border-bright hover:text-foreground"
                          : "border-border bg-surface-2/50 text-muted-2 cursor-not-allowed opacity-60"
                    )}
                  >
                    {isSelected && (
                      <Icon className="size-4 text-copper" />
                    )}
                    <span>{type.label}</span>
                    {!type.available && (
                      <span className="ml-auto rounded bg-surface-3 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-2">
                        Soon
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Address input */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-muted-2">
                Where is the lot? <span className="text-muted-2">(optional)</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-2" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Cedar Lane, Zionsville, IN"
                  className="w-full rounded-xl border border-border bg-surface-2 py-3 pl-10 pr-4 text-sm placeholder:text-muted-2 transition-all duration-300 focus:border-copper focus:outline-none focus:ring-1 focus:ring-copper"
                />
              </div>
            </div>

            {/* CTA Button */}
            <Button size="lg" className="w-full">
              Open the builder
              <ArrowRight className="size-4" />
            </Button>

            <p className="text-center text-xs text-muted-2">
              3 designs free · No card · Picks up where you left off
            </p>
          </div>

          {/* Right side - Context panel */}
          <div className="rounded-xl border border-border bg-surface-2/50 p-6 transition-all duration-300">
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wider text-muted-2">
                  {"You're starting"}
                </p>
                <p className="font-display text-xl text-copper">
                  {selectedType?.label}
                </p>
                <p className="text-sm text-muted">
                  {selected === "custom-home"
                    ? "A full custom house designed from lot to plan set."
                    : "A complete outdoor living space with layout and materials."}
                </p>
              </div>

              <ul className="space-y-3">
                {contextSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-copper/20">
                      <Check className="size-3 text-copper" />
                    </span>
                    <span className="text-muted">{step}</span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-sm">
                <MapPin className="size-4 text-muted-2" />
                <span className="text-muted">
                  Add an address, or pick the lot on the map next.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
