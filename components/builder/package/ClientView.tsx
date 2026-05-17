"use client";

/**
 * ClientView — the emotional sell + the close.
 *
 * Leads with the geometry-accurate build render (`BuildRenderPanel` — a still
 * drawn straight from the designed 3D model, keyless and truthful), then keeps
 * the AI photoreal-finish seam present below it (`SitePhotoPreview` over
 * `lib/imagegen`, the slot for the future photoreal pass), states the design
 * vision and the headline numbers, and closes with "Approve & pay deposit".
 *
 * The close calls `/api/stripe/checkout`. That endpoint degrades gracefully
 * when Stripe is unconfigured (keyless) — this view surfaces every outcome
 * honestly (redirect on success, a calm note when payments aren't configured)
 * and never breaks the page.
 */
import { useState } from "react";
import {
  ArrowRight,
  BedDouble,
  CheckCircle2,
  ImageOff,
  Loader2,
  Lock,
  Ruler,
  ShieldCheck,
  Sparkles,
  Trees,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SitePhotoPreview } from "@/components/builder/SitePhotoPreview";
import { BuildRenderPanel } from "@/components/builder/package/BuildRenderPanel";
import type { ParsedRequirements } from "@/lib/builder";
import type { ProjectType } from "@/lib/db/types";
import type { HardscapePlan } from "@/lib/hardscape/types";
import type { PlanGraph } from "@/lib/kernel/types";
import type { SitePhoto } from "@/lib/site-photo";
import { formatUsdCents, type DepositFigure } from "@/lib/package";

const MM_PER_FT = 304.8;

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

interface ClientViewProps {
  projectType: ProjectType;
  projectId: string | null;
  homePlan: PlanGraph | null;
  parsed: ParsedRequirements | null;
  homeBrief: string | null;
  hardscapePlan: HardscapePlan | null;
  photo: SitePhoto | null;
  deposit: DepositFigure;
}

export function ClientView({
  projectType,
  projectId,
  homePlan,
  parsed,
  homeBrief,
  hardscapePlan,
  photo,
  deposit,
}: ClientViewProps) {
  const isHardscape = projectType === "hardscape";

  const headline =
    isHardscape && hardscapePlan
      ? hardscapeHeadline(hardscapePlan)
      : homeHeadline(parsed, homePlan);

  const vision = isHardscape
    ? hardscapeVision(hardscapePlan)
    : (parsed && describeHomeVision(parsed)) ||
      homeBrief ||
      "A custom home, sited and drawn — ready to bring to life.";

  const stats = isHardscape
    ? hardscapeStats(hardscapePlan)
    : homeStats(parsed);

  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      {/* Render surface — the emotional lead. The geometry-accurate build
          render comes first (truthful, drawn from the model); the AI
          photoreal-finish seam stays present below it. */}
      <div className="flex flex-col gap-5">
        <BuildRenderPanel
          homePlan={homePlan}
          hardscapePlan={hardscapePlan}
          isHardscape={isHardscape}
        />

        {/* AI photoreal finish — the seam for the future img2video pass.
            Present with a captured site photo; an honest placeholder
            otherwise. The build render above is the deliverable today. */}
        {photo ? (
          <SitePhotoPreview
            photo={{
              dataUrl: photo.dataUrl,
              mimeType: photo.mimeType,
              width: photo.width,
              height: photo.height,
            }}
            intent={{
              projectType,
              style: parsed?.style,
              brief: isHardscape
                ? hardscapeVision(hardscapePlan)
                : homeBrief ?? undefined,
              features: parsed?.must_haves,
            }}
          />
        ) : (
          <RenderPlaceholder />
        )}

        <div className="rounded-card border border-border bg-surface p-5">
          <p className="text-[11px] uppercase tracking-[0.15em] text-copper">
            The design vision
          </p>
          <h3 className="mt-2 font-display text-xl tracking-tight">
            {headline}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">{vision}</p>
        </div>
      </div>

      {/* The close. */}
      <div className="flex flex-col gap-5">
        <div className="rounded-card border border-border bg-surface p-5">
          <p className="text-[11px] uppercase tracking-[0.15em] text-muted-2">
            At a glance
          </p>
          <dl className="mt-3 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-border bg-border">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-surface-2 p-3 text-center">
                  <Icon className="mx-auto size-4 text-copper" />
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {s.value}
                  </dd>
                  <dt className="text-[10px] uppercase tracking-wide text-muted-2">
                    {s.label}
                  </dt>
                </div>
              );
            })}
          </dl>
        </div>

        <DepositCard
          projectType={projectType}
          projectId={projectId}
          deposit={deposit}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* The deposit close                                                          */
/* -------------------------------------------------------------------------- */

type CheckoutState =
  | { kind: "idle" }
  | { kind: "starting" }
  | { kind: "redirecting" }
  | { kind: "unconfigured"; message: string }
  | { kind: "error"; message: string };

function DepositCard({
  projectType,
  projectId,
  deposit,
}: {
  projectType: ProjectType;
  projectId: string | null;
  deposit: DepositFigure;
}) {
  const [state, setState] = useState<CheckoutState>({ kind: "idle" });
  const isHardscape = projectType === "hardscape";

  async function approveAndPay() {
    if (state.kind === "starting" || state.kind === "redirecting") return;
    setState({ kind: "starting" });

    // No project id means there is no server-side project for Stripe to load —
    // the keyless flow can land here. Surface it as the same calm
    // "not configured" outcome rather than a hard failure.
    if (!projectId) {
      setState({
        kind: "unconfigured",
        message:
          "This is a keyless preview — no project record to bill against. " +
          "The deposit and approval are recorded once the project is saved.",
      });
      return;
    }

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      if (res.ok) {
        const data = (await res.json()) as { url?: string };
        if (data.url) {
          setState({ kind: "redirecting" });
          window.location.href = data.url;
          return;
        }
        setState({
          kind: "error",
          message: "Checkout did not return a payment link. Please try again.",
        });
        return;
      }
      // 503 (Stripe / storage not configured) or 404 (no server project) — a
      // graceful degradation, not a crash. Read the route's clean error.
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (res.status === 503 || res.status === 404) {
        setState({
          kind: "unconfigured",
          message:
            body?.error ??
            "Payments are not configured in this preview — the deposit is " +
              "recorded for the contractor to collect.",
        });
        return;
      }
      setState({
        kind: "error",
        message: body?.error ?? "Could not start checkout. Please try again.",
      });
    } catch {
      setState({
        kind: "error",
        message: "Network error — please try again.",
      });
    }
  }

  const busy = state.kind === "starting" || state.kind === "redirecting";

  return (
    <div className="rounded-card border border-border-bright bg-surface p-5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-4 text-sage" />
        <p className="text-sm font-medium text-foreground">
          Approve &amp; fund the start
        </p>
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-3">
        <span className="text-sm text-muted">
          {isHardscape ? "Deposit to start the build" : "Design fee to begin"}
        </span>
        <span className="font-display text-2xl tracking-tight text-copper-bright">
          {formatUsdCents(deposit.depositCents)}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-2">
        {isHardscape
          ? deposit.anchored
            ? `${Math.round(deposit.fraction * 100)}% of the ${formatUsdCents(
                deposit.projectValueCents,
              )} estimated installed cost.`
            : "A planning-stage deposit — finalised against the real estimate."
          : deposit.anchored
            ? "Consultation plus design deposit — funds the permit-ready set."
            : "A planning-stage design fee — finalised once the brief is set."}
      </p>

      {state.kind === "unconfigured" ? (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-surface-2 p-3">
          <ImageOff className="mt-0.5 size-4 shrink-0 text-muted-2" />
          <p className="text-xs leading-relaxed text-muted">{state.message}</p>
        </div>
      ) : (
        <Button
          onClick={approveAndPay}
          disabled={busy}
          size="lg"
          className="mt-4 w-full"
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {state.kind === "redirecting"
                ? "Opening secure checkout…"
                : "Starting…"}
            </>
          ) : (
            <>
              <Lock className="size-4" />
              Approve &amp; pay deposit
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      )}

      {state.kind === "error" && (
        <p className="mt-2 text-xs text-copper-bright" role="alert">
          {state.message}
        </p>
      )}

      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-2">
        <CheckCircle2 className="size-3.5 text-sage" />
        Secure checkout by Stripe — the contractor is notified on approval.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* AI photoreal-finish placeholder — honest when no site photo exists          */
/* -------------------------------------------------------------------------- */

function RenderPlaceholder() {
  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-copper/15 text-copper">
          <Sparkles className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="font-display text-base tracking-tight text-foreground">
            AI photoreal finish
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-2">
            A later pass. Add a site photo at the lot step and Atelier renders
            the design vision onto the real site here — over the build render
            above.
          </p>
        </div>
      </div>
      <div className="mt-4 grid aspect-[16/9] place-items-center rounded-lg border border-dashed border-border bg-ink">
        <div className="flex flex-col items-center gap-2 text-center">
          <ImageOff className="size-6 text-muted-2" />
          <p className="max-w-[16rem] text-xs text-muted-2">
            No site photo captured — the photoreal-finish surface lights up
            once a photo is added.
          </p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Per-type headline / vision / stats                                         */
/* -------------------------------------------------------------------------- */

function homeHeadline(
  parsed: ParsedRequirements | null,
  plan: PlanGraph | null,
): string {
  if (parsed) return `A ${titleCase(parsed.style)}, drawn and sited`;
  if (plan) return `A ${plan.rooms.length}-room custom home`;
  return "Your custom home";
}

function describeHomeVision(parsed: ParsedRequirements): string {
  const story =
    parsed.story_count === 1
      ? "single-story"
      : `${parsed.story_count}-story`;
  const feats =
    parsed.must_haves.length > 0
      ? ` Built around ${parsed.must_haves.slice(0, 3).join(", ")}.`
      : "";
  return (
    `A ${story} ${titleCase(parsed.style)} of about ` +
    `${parsed.sqft.toLocaleString()} sq ft — ${parsed.beds} bedrooms, ` +
    `${parsed.baths} baths, on a ${parsed.lot_size} lot.${feats}`
  );
}

function homeStats(parsed: ParsedRequirements | null) {
  if (!parsed) {
    return [
      { icon: Ruler, label: "Area", value: "—" },
      { icon: BedDouble, label: "Beds", value: "—" },
      { icon: Trees, label: "Lot", value: "—" },
    ];
  }
  return [
    {
      icon: Ruler,
      label: "Area",
      value: `${parsed.sqft.toLocaleString()} ft²`,
    },
    {
      icon: BedDouble,
      label: "Beds · Baths",
      value: `${parsed.beds} · ${parsed.baths}`,
    },
    { icon: Trees, label: "Lot", value: parsed.lot_size },
  ];
}

function hardscapeHeadline(plan: HardscapePlan): string {
  const surfaces = plan.elements.filter((e) => e.kind !== "border").length;
  return `A ${surfaces}-surface backyard, laid out and priced`;
}

function hardscapeVision(plan: HardscapePlan | null): string {
  if (!plan) {
    return "A backyard of hardscape surfaces, laid out and ready to build.";
  }
  const surfaces = plan.elements.filter((e) => e.kind !== "border");
  const kinds = [...new Set(surfaces.map((e) => e.kind.replace(/-/g, " ")))];
  return (
    `A backyard of ${kinds.join(", ")} — ` +
    `${Math.round(plan.totalAreaSqft).toLocaleString()} sq ft of finished ` +
    "hardscape, laid out, sized, and ready for the crew."
  );
}

function hardscapeStats(plan: HardscapePlan | null) {
  if (!plan) {
    return [
      { icon: Ruler, label: "Area", value: "—" },
      { icon: Trees, label: "Surfaces", value: "—" },
      { icon: Building2Stat, label: "Site", value: "—" },
    ];
  }
  const surfaces = plan.elements.filter((e) => e.kind !== "border").length;
  return [
    {
      icon: Ruler,
      label: "Hardscape",
      value: `${Math.round(plan.totalAreaSqft).toLocaleString()} ft²`,
    },
    { icon: Trees, label: "Surfaces", value: String(surfaces) },
    {
      icon: Building2Stat,
      label: "Site",
      value: `${Math.round(plan.bounds.width / MM_PER_FT)}′×${Math.round(
        plan.bounds.height / MM_PER_FT,
      )}′`,
    },
  ];
}

/** Small inline icon alias so the stat row stays self-contained. */
function Building2Stat(props: { className?: string }) {
  return <Ruler {...props} />;
}
