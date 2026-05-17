"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BedDouble,
  Bath,
  Check,
  FileText,
  Image as ImageIcon,
  Loader2,
  Lock,
  Maximize2,
  Ruler,
  ShieldCheck,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatUSD, type PortalProject } from "@/lib/portal-mock";

type PayState = "idle" | "processing" | "funded";

export function PortalClient({
  project,
  stripeEnabled,
  initialFunded,
}: {
  project: PortalProject;
  /** True when Stripe is configured — drives real Checkout vs. the demo flow. */
  stripeEnabled: boolean;
  /** True when Stripe's success_url returned the client here funded. */
  initialFunded: boolean;
}) {
  const [payState, setPayState] = useState<PayState>(
    initialFunded ? "funded" : "idle",
  );
  const [payError, setPayError] = useState<string | null>(null);
  const reduce = useReducedMotion();

  async function approve() {
    if (payState !== "idle") return;
    setPayError(null);
    setPayState("processing");

    // Keyless demo: with no Stripe configured, show the funded state directly.
    if (!stripeEnabled) {
      window.setTimeout(() => setPayState("funded"), 1600);
      return;
    }

    // Real payment: create a Checkout Session and hand off to Stripe. The
    // session's success_url returns the client with `?funded=1`.
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: project.slug, token: project.token }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Checkout could not be started.");
      }
      window.location.href = data.url;
    } catch (err) {
      setPayError(
        err instanceof Error ? err.message : "Checkout could not be started.",
      );
      setPayState("idle");
    }
  }

  const reveal = reduce
    ? {}
    : ({
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease: "easeOut" },
      } as const);

  if (payState === "funded") {
    return <FundedState project={project} />;
  }

  return (
    <div className="min-h-dvh bg-ink pb-32 text-foreground">
      <TopBar project={project} />

      <main className="mx-auto max-w-5xl px-4 sm:px-6">
        <motion.div {...reveal}>
          <Hero project={project} />
          <ProjectTabs project={project} />
        </motion.div>
      </main>

      <StickyFooter
        project={project}
        payState={payState}
        error={payError}
        onApprove={approve}
      />
    </div>
  );
}

/* ----------------------------------------------------------------------- */

function TopBar({ project }: { project: PortalProject }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-ink/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="grid size-10 place-items-center rounded-xl bg-copper font-display text-sm font-semibold text-ink"
          >
            {project.builderInitials}
          </div>
          <div className="leading-tight">
            <p className="font-display text-sm tracking-tight text-foreground">
              {project.builderName}
            </p>
            <p className="text-[11px] text-muted-2">
              Designed by {project.builderName} on Atelier
            </p>
          </div>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-[11px] text-muted sm:inline-flex">
          <Lock className="size-3 text-sage" />
          Private project link
        </span>
      </div>
    </header>
  );
}

/* ----------------------------------------------------------------------- */

function Hero({ project }: { project: PortalProject }) {
  return (
    <section className="pt-8">
      <div className="flex flex-col items-start gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted">
          <span className="size-1.5 rounded-full bg-copper" />
          Design proposal for {project.clientName}
        </span>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
          {project.projectName}
        </h1>
        <p className="text-sm text-muted">{project.heroCaption}</p>
      </div>

      <div className="relative mt-5 aspect-[16/9] w-full overflow-hidden rounded-card border border-border bg-ink-2">
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_70%_12%,rgba(210,138,85,0.20),transparent_55%),radial-gradient(120%_120%_at_16%_92%,rgba(143,161,131,0.16),transparent_55%)]" />
        <RenderArtwork variant="hero" />
        <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full border border-border bg-ink/80 px-2.5 py-1 text-[11px] text-muted backdrop-blur">
          <ImageIcon className="size-3 text-copper" />
          Primary rendering
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          icon={<Ruler className="size-4 text-copper" />}
          label="Conditioned area"
          value={`${project.squareFeet.toLocaleString("en-US")} sq ft`}
        />
        <Stat
          icon={<BedDouble className="size-4 text-copper" />}
          label="Bedrooms"
          value={String(project.bedrooms)}
        />
        <Stat
          icon={<Bath className="size-4 text-copper" />}
          label="Bathrooms"
          value={String(project.bathrooms)}
        />
        <Stat
          icon={<ShieldCheck className="size-4 text-copper" />}
          label="Style"
          value={project.styleLabel}
        />
      </dl>
    </section>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-card border border-border bg-surface p-3.5">
      <div className="flex items-center gap-1.5">
        {icon}
        <dt className="text-[10px] uppercase tracking-wide text-muted-2">
          {label}
        </dt>
      </div>
      <dd className="mt-1.5 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

/* ----------------------------------------------------------------------- */

function ProjectTabs({ project }: { project: PortalProject }) {
  return (
    <section className="mt-10">
      <Tabs defaultValue="plans">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="plans" className="flex-1 sm:flex-none">
            Plans
          </TabsTrigger>
          <TabsTrigger value="renders" className="flex-1 sm:flex-none">
            Renders
          </TabsTrigger>
          <TabsTrigger value="spec" className="flex-1 sm:flex-none">
            Spec
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex-1 sm:flex-none">
            Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="mt-6">
          <PlansPanel project={project} />
        </TabsContent>
        <TabsContent value="renders" className="mt-6">
          <RendersPanel project={project} />
        </TabsContent>
        <TabsContent value="spec" className="mt-6">
          <SpecPanel project={project} />
        </TabsContent>
        <TabsContent value="documents" className="mt-6">
          <DocumentsPanel project={project} />
        </TabsContent>
      </Tabs>
    </section>
  );
}

function PanelHeading({
  title,
  blurb,
}: {
  title: string;
  blurb: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="font-display text-xl tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted">{blurb}</p>
    </div>
  );
}

function PlansPanel({ project }: { project: PortalProject }) {
  return (
    <div>
      <PanelHeading
        title="Floor plans"
        blurb="Schematic layouts for each level. Final dimensions confirmed in construction documents."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {project.plans.map((plan) => (
          <div
            key={plan.level}
            className="overflow-hidden rounded-card border border-border bg-surface"
          >
            <div className="relative aspect-[4/3] border-b border-border bg-ink-2">
              <SchematicArtwork />
              <span className="absolute left-3 top-3 rounded-full border border-border bg-ink/80 px-2.5 py-1 text-[11px] text-muted backdrop-blur">
                {plan.level}
              </span>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  {plan.level}
                </p>
                <p className="text-xs text-copper-bright">{plan.area}</p>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {plan.rooms}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RendersPanel({ project }: { project: PortalProject }) {
  return (
    <div>
      <PanelHeading
        title="Renderings"
        blurb="Photoreal previews of the proposed design, inside and out."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {project.renders.map((render, i) => (
          <figure
            key={render.id}
            className="overflow-hidden rounded-card border border-border bg-surface"
          >
            <div className="relative aspect-[4/3] border-b border-border bg-ink-2">
              <RenderArtwork variant={i % 2 === 0 ? "warm" : "cool"} />
              <span className="absolute right-3 top-3 grid size-7 place-items-center rounded-full border border-border bg-ink/80 text-muted backdrop-blur">
                <Maximize2 className="size-3" />
              </span>
            </div>
            <figcaption className="p-3.5">
              <p className="text-sm font-medium text-foreground">
                {render.label}
              </p>
              <p className="mt-0.5 text-xs text-muted">{render.caption}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

function SpecPanel({ project }: { project: PortalProject }) {
  return (
    <div>
      <PanelHeading
        title="Room & materials spec"
        blurb="Preliminary scope of finishes by space. Allowances confirmed at contract."
      />
      <div className="overflow-hidden rounded-card border border-border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-surface-2 text-[11px] uppercase tracking-wide text-muted-2">
              <th className="px-4 py-3 font-medium">Room</th>
              <th className="px-4 py-3 font-medium">Area</th>
              <th className="px-4 py-3 font-medium">Primary finishes</th>
            </tr>
          </thead>
          <tbody>
            {project.rooms.map((room, i) => (
              <tr
                key={room.name}
                className={cn(
                  "border-t border-border",
                  i % 2 === 0 ? "bg-surface" : "bg-surface/50",
                )}
              >
                <td className="px-4 py-3 font-medium text-foreground">
                  {room.name}
                </td>
                <td className="px-4 py-3 text-muted">{room.area}</td>
                <td className="px-4 py-3 text-muted">{room.finish}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DocumentsPanel({ project }: { project: PortalProject }) {
  return (
    <div>
      <PanelHeading
        title="Project documents"
        blurb="Drawing sets and agreements shared by your builder."
      />
      <ul className="grid gap-3 sm:grid-cols-2">
        {project.documents.map((doc) => (
          <li key={doc.name}>
            {/* TODO(v2): link to signed asset URLs from project storage. */}
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-card border border-border bg-surface p-4 text-left transition-colors hover:border-border-bright"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface-2 text-copper">
                <FileText className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">
                  {doc.name}
                </span>
                <span className="block text-xs text-muted-2">
                  {doc.kind} · {doc.size}
                </span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-muted-2" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ----------------------------------------------------------------------- */

function StickyFooter({
  project,
  payState,
  error,
  onApprove,
}: {
  project: PortalProject;
  payState: PayState;
  error: string | null;
  onApprove: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-ink/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <dl className="flex flex-wrap items-center gap-x-6 gap-y-1.5">
          <PriceItem label="Design fee" value={formatUSD(project.designFee)} />
          <PriceItem
            label="Deposit due"
            value={formatUSD(project.deposit)}
            emphasis
          />
          <PriceItem
            label="Construction estimate"
            value={formatUSD(project.constructionEstimate)}
          />
        </dl>
        <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
          <Button
            size="lg"
            onClick={onApprove}
            disabled={payState === "processing"}
            className="w-full sm:w-auto sm:min-w-[15rem]"
          >
            {payState === "processing" ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                Approve &amp; pay deposit
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
          {error && (
            <p className="text-xs text-copper-bright" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function PriceItem({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wide text-muted-2">
        {label}
      </dt>
      <dd
        className={cn(
          "text-sm font-medium tabular-nums",
          emphasis ? "text-copper-bright" : "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/* ----------------------------------------------------------------------- */

function FundedState({ project }: { project: PortalProject }) {
  const reduce = useReducedMotion();
  return (
    <div className="grid min-h-dvh place-items-center bg-ink px-4 text-foreground">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md text-center"
      >
        <motion.div
          initial={reduce ? false : { scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
          className="mx-auto grid size-16 place-items-center rounded-full bg-sage/15 text-sage"
        >
          <Check className="size-8" />
        </motion.div>
        <h1 className="mt-6 font-display text-2xl tracking-tight sm:text-3xl">
          Project funded
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
          Your deposit of {formatUSD(project.deposit)} is confirmed. Your
          builder will be in touch within 24 hours to schedule the next steps.
        </p>

        <div className="mt-6 rounded-card border border-border bg-surface p-5 text-left">
          <Receipt label="Project" value={project.projectName} />
          <Receipt label="Builder" value={project.builderName} />
          <Receipt label="Design fee" value={formatUSD(project.designFee)} />
          <Receipt
            label="Deposit paid"
            value={formatUSD(project.deposit)}
            emphasis
          />
          <Receipt
            label="Construction estimate"
            value={formatUSD(project.constructionEstimate)}
          />
        </div>

        <p className="mt-5 text-[11px] text-muted-2">
          Designed by {project.builderName} on Atelier · Receipt sent to your
          email.
        </p>
      </motion.div>
    </div>
  );
}

function Receipt({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-2.5 last:border-b-0 last:pb-0 first:pt-0">
      <span className="text-xs text-muted-2">{label}</span>
      <span
        className={cn(
          "text-sm font-medium tabular-nums",
          emphasis ? "text-sage" : "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

/* --- Decorative artwork (no real assets needed) ------------------------ */

function RenderArtwork({
  variant = "warm",
}: {
  variant?: "hero" | "warm" | "cool";
}) {
  const sky =
    variant === "cool"
      ? "rgba(143,161,131,0.22)"
      : "rgba(210,138,85,0.22)";
  return (
    <svg
      viewBox="0 0 400 300"
      className="absolute inset-0 size-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <rect width="400" height="300" fill="transparent" />
      <rect y="210" width="400" height="90" fill="rgba(143,161,131,0.10)" />
      <polygon points="70,210 200,120 330,210" fill={sky} />
      <rect x="110" y="170" width="180" height="80" fill="rgba(255,255,255,0.05)" />
      <rect
        x="110"
        y="170"
        width="180"
        height="80"
        fill="none"
        stroke="var(--color-copper)"
        strokeWidth="1.5"
        strokeOpacity="0.55"
      />
      <rect x="128" y="190" width="34" height="44" fill="rgba(210,138,85,0.30)" />
      <rect x="183" y="190" width="34" height="44" fill="rgba(210,138,85,0.18)" />
      <rect x="238" y="190" width="34" height="44" fill="rgba(210,138,85,0.30)" />
      <circle cx="320" cy="74" r="22" fill="rgba(236,171,120,0.35)" />
    </svg>
  );
}

function SchematicArtwork() {
  return (
    <svg
      viewBox="0 0 320 240"
      className="absolute inset-0 size-full"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="portal-grid"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M20 0H0V20"
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="320" height="240" fill="url(#portal-grid)" opacity="0.6" />
      <g
        fill="rgba(210,138,85,0.08)"
        stroke="var(--color-copper)"
        strokeWidth="1.6"
        strokeOpacity="0.7"
      >
        <rect x="44" y="48" width="232" height="144" />
        <line x1="150" y1="48" x2="150" y2="192" />
        <line x1="44" y1="124" x2="150" y2="124" />
        <rect x="170" y="64" width="86" height="64" fillOpacity="0.5" />
      </g>
      <circle cx="150" cy="124" r="4" fill="var(--color-copper)" />
    </svg>
  );
}
