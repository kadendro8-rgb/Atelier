"use client";

import { ArrowLeft, ArrowRight, Check, Compass, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Design } from "@/lib/design";
import { Header } from "./PlanStep";

export function SiteStep({
  design,
  onBack,
  onContinue,
}: {
  design: Design;
  onBack: () => void;
  onContinue: () => void;
}) {
  const { lotAcres, sqft, stories } = design.params;
  const lotSqft = Math.round(lotAcres * 43560);
  const footprint = Math.round(sqft / stories);
  const coverage = Math.min(95, Math.round((footprint / lotSqft) * 100));

  return (
    <div className="mx-auto max-w-5xl">
      <Header
        step="Step 3 · Site"
        title="Drop it on the parcel"
        sub="Atelier pulled the lot from county GIS, applied the setbacks, and fit the home inside the buildable envelope."
      />

      <div className="mt-7 grid gap-5 lg:grid-cols-[1.55fr_1fr]">
        <div className="rounded-card border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <MapPin className="size-3.5 text-copper" />
              {design.projectName} · parcel
            </span>
            <span className="text-xs text-muted-2">{lotAcres} ac</span>
          </div>
          <div className="mt-3 overflow-hidden rounded-lg border border-border">
            <ParcelMap />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-card border border-border bg-surface p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Compass className="size-4 text-copper" />
              Site analysis
            </div>
            <dl className="mt-3 space-y-2.5 text-xs">
              {[
                ["Lot area", `${lotSqft.toLocaleString()} sq ft`],
                ["Building footprint", `${footprint.toLocaleString()} sq ft`],
                ["Lot coverage", `${coverage}%`],
                ["Front / side / rear setbacks", "25′ / 10′ / 20′"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <dt className="text-muted-2">{k}</dt>
                  <dd className="font-medium text-foreground">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-card border border-sage/30 bg-sage/5 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-sage">
              <Check className="size-4" />
              Fits the buildable envelope
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              The home, driveway, and required setbacks all sit within the
              parcel. Zoning district R-1 permits this use.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="subtle" onClick={onBack} className="flex-1">
              <ArrowLeft className="size-4" /> Plan
            </Button>
            <Button onClick={onContinue} className="flex-[2]">
              Generate renders <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ParcelMap() {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full" aria-hidden="true">
      <rect width="400" height="300" fill="#100e0b" />
      {/* street */}
      <path d="M-10 268 L410 256" stroke="#2c281f" strokeWidth="26" />
      <path
        d="M-10 268 L410 256"
        stroke="#423a2c"
        strokeWidth="1.5"
        strokeDasharray="10 8"
      />
      {/* neighbouring parcels */}
      <rect x="20" y="40" width="100" height="180" fill="none" stroke="#241f18" strokeWidth="1.5" />
      <rect x="284" y="40" width="100" height="184" fill="none" stroke="#241f18" strokeWidth="1.5" />

      {/* the parcel */}
      <polygon
        points="128,38 276,42 272,236 132,232"
        fill="rgba(210,138,85,0.08)"
        stroke="#d28a55"
        strokeWidth="2"
      />
      {/* buildable envelope */}
      <polygon
        points="150,70 254,72 251,206 153,204"
        fill="none"
        stroke="#8fa183"
        strokeWidth="1.5"
        strokeDasharray="5 4"
      />
      {/* trees */}
      <circle cx="166" cy="58" r="9" fill="#1d2a1c" />
      <circle cx="252" cy="60" r="11" fill="#1d2a1c" />
      <circle cx="160" cy="220" r="10" fill="#1d2a1c" />

      {/* home footprint */}
      <g>
        <rect x="164" y="96" width="78" height="74" fill="rgba(210,138,85,0.34)" stroke="#ecab78" strokeWidth="2" />
        <rect x="164" y="96" width="26" height="74" fill="rgba(66,58,44,0.7)" stroke="#ecab78" strokeWidth="1.5" />
        <text x="216" y="136" textAnchor="middle" fontSize="9" fill="#ecab78">
          Home
        </text>
      </g>
      {/* driveway */}
      <path d="M177 170 L182 256" stroke="#2c281f" strokeWidth="14" strokeLinecap="round" />

      {/* labels */}
      <text x="201" y="250" textAnchor="middle" fontSize="9" fill="#79705f">
        Cedar Lane
      </text>
      <g transform="translate(360 44)">
        <circle r="13" fill="#15130f" stroke="#2c281f" />
        <path d="M0 -8 L3 0 L0 8 L-3 0 Z" fill="#d28a55" />
        <text y="-16" textAnchor="middle" fontSize="8" fill="#79705f">
          N
        </text>
      </g>
    </svg>
  );
}
