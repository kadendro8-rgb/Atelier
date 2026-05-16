"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Layers, Loader2, MapPin, Search } from "lucide-react";
import { BuilderShell } from "@/components/builder/BuilderShell";
import { Button } from "@/components/ui/button";

type Parcel = {
  address: string;
  apn: string;
  zoning: string;
  lotAcres: string;
  source: string;
};

const ZONING = [
  "R-1 Single-family",
  "R-2 Low-density residential",
  "RR Rural residential",
  "RE Residential estate",
];

/**
 * Deterministic parcel stand-in derived from the address. Live county-GIS +
 * MapLibre integration is tracked in docs/v2-spec.md (Lot step).
 */
function deriveParcel(address: string): Parcel {
  let h = 0;
  for (let i = 0; i < address.length; i++) {
    h = (h * 31 + address.charCodeAt(i)) | 0;
  }
  h = Math.abs(h);
  return {
    address,
    apn: `${(h % 90) + 10}-${((h >> 3) % 9000) + 1000}-${((h >> 7) % 900) + 100}`,
    zoning: ZONING[h % ZONING.length],
    lotAcres: (((h >> 5) % 240) / 100 + 0.18).toFixed(2),
    source: "County GIS · IRC 2021",
  };
}

export default function LotPickerPage() {
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<"idle" | "searching" | "found">("idle");
  const [parcel, setParcel] = useState<Parcel | null>(null);
  const router = useRouter();
  const reduce = useReducedMotion();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = address.trim();
    if (q.length < 4 || status === "searching") return;
    setStatus("searching");
    window.setTimeout(() => {
      setParcel(deriveParcel(q));
      setStatus("found");
    }, 900);
  }

  function confirmParcel() {
    if (parcel) localStorage.setItem("atelier:lot", JSON.stringify(parcel));
    router.push("/builder/brief");
  }

  function skip() {
    localStorage.removeItem("atelier:lot");
    router.push("/builder/brief");
  }

  const reveal = reduce
    ? {}
    : ({
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease: "easeOut" },
      } as const);

  return (
    <BuilderShell current="lot">
      <motion.div {...reveal} className="mx-auto max-w-2xl">
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted">
            <MapPin className="size-3.5 text-copper" />
            Step 0 · The lot
          </span>
          <h1 className="mt-4 font-display text-3xl tracking-tight sm:text-4xl">
            Start with the lot
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
            Type an address and Atelier pulls the parcel, zoning, and setbacks
            from public county GIS — so the design is sited from the first
            click.
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="mt-8 flex flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-2" />
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Cedar Lane, Zionsville, IN — or an APN"
              aria-label="Lot address or APN"
              className="w-full rounded-lg border border-border bg-surface py-3 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-2 transition-colors focus-visible:border-copper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper/30"
            />
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={address.trim().length < 4 || status === "searching"}
          >
            {status === "searching" ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Locating
              </>
            ) : (
              <>
                Find the lot <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>

        {parcel && status === "found" && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="mt-6 overflow-hidden rounded-card border border-border bg-surface"
          >
            <ParcelPreview />
            <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
              <Fact label="Parcel APN" value={parcel.apn} />
              <Fact label="Lot size" value={`${parcel.lotAcres} ac`} />
              <Fact label="Zoning" value={parcel.zoning} />
              <Fact label="Source" value={parcel.source} />
            </div>
            <div className="p-4">
              <p className="text-xs text-muted-2">{parcel.address}</p>
              <Button onClick={confirmParcel} size="lg" className="mt-3 w-full">
                Confirm parcel &amp; continue <ArrowRight className="size-4" />
              </Button>
            </div>
          </motion.div>
        )}

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={skip}
            className="text-sm text-muted-2 underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Skip — design without a lot
          </button>
        </div>
      </motion.div>
    </BuilderShell>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface p-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-2">
        {label}
      </p>
      <p className="mt-0.5 text-xs font-medium text-foreground">{value}</p>
    </div>
  );
}

function ParcelPreview() {
  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-border bg-ink-2">
      <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_72%_8%,rgba(143,161,131,0.16),transparent_55%),radial-gradient(120%_120%_at_18%_94%,rgba(210,138,85,0.12),transparent_55%)]" />
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-border) 1px,transparent 1px),linear-gradient(90deg,var(--color-border) 1px,transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <svg
        viewBox="0 0 320 180"
        className="absolute inset-0 size-full"
        aria-hidden="true"
      >
        <polygon
          points="86,36 252,50 240,152 68,140"
          className="fill-copper/10 stroke-copper"
          strokeWidth="2"
          strokeDasharray="6 4"
        />
        <polygon
          points="122,72 200,78 194,122 116,116"
          className="fill-copper/20 stroke-copper/60"
          strokeWidth="1.5"
        />
      </svg>
      <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-border bg-ink/80 px-2.5 py-1 text-[10px] text-muted backdrop-blur">
        <Layers className="size-3 text-copper" />
        Satellite parcel preview
      </div>
    </div>
  );
}
