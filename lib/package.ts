/**
 * Builder packaging stage — shared, keyless helpers.
 *
 * The packaging stage (`/builder/package`) is the builder's final step: it
 * presents the finished project as a shippable deliverable across three
 * audience lenses (client, contractor, architect). This module carries the
 * pure, UI-agnostic glue that stage needs:
 *
 *  - reading the cached hardscape estimate (`atelier:hardscape:estimate`);
 *  - deriving a deposit figure anchored to a real estimate where one exists;
 *  - the home pricing model (mirrors `lib/design.ts`).
 *
 * Everything here is keyless and reload-safe — every storage read is wrapped
 * so a disabled / private-mode store never breaks the stage.
 */
import type { HardscapeCostEstimate } from "@/lib/hardscape/cost";
import type { ParsedRequirements } from "@/lib/builder";

/** localStorage key the layout step caches the hardscape estimate under. */
export const HARDSCAPE_ESTIMATE_KEY = "atelier:hardscape:estimate";

/** Runtime shape guard for a restored `HardscapeCostEstimate`. */
export function isHardscapeEstimate(
  value: unknown,
): value is HardscapeCostEstimate {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.lowCents === "number" &&
    Number.isFinite(v.lowCents) &&
    typeof v.highCents === "number" &&
    Number.isFinite(v.highCents)
  );
}

/**
 * Restore the cached hardscape estimate, or null when none is stored / it is
 * corrupt / storage is unavailable. Never throws.
 */
export function loadHardscapeEstimate(): HardscapeCostEstimate | null {
  try {
    const raw = window.localStorage.getItem(HARDSCAPE_ESTIMATE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isHardscapeEstimate(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Deposit model                                                              */
/* -------------------------------------------------------------------------- */

/** A deposit figure with the headline numbers behind it, all in whole cents. */
export interface DepositFigure {
  /** The deposit amount to collect now. */
  depositCents: number;
  /** The full project value the deposit is a slice of. */
  projectValueCents: number;
  /** Deposit as a fraction of the project value, e.g. 0.1. */
  fraction: number;
  /** Whether this is anchored to a real estimate or a planning default. */
  anchored: boolean;
}

/** Deposit fraction of the full project value — a conventional 10%. */
const DEPOSIT_FRACTION = 0.1;

/**
 * Derive a deposit figure for a hardscape project from its cached estimate.
 * The project value is the midpoint of the low/high installed-cost range; the
 * deposit is a conventional 10% slice. Falls back to a sensible planning
 * default when no estimate is cached.
 */
export function hardscapeDeposit(
  estimate: HardscapeCostEstimate | null,
): DepositFigure {
  if (estimate) {
    const projectValueCents = Math.round(
      (estimate.lowCents + estimate.highCents) / 2,
    );
    return {
      depositCents: Math.round(projectValueCents * DEPOSIT_FRACTION),
      projectValueCents,
      fraction: DEPOSIT_FRACTION,
      anchored: true,
    };
  }
  // No estimate cached — a calm planning default ($18k job).
  const projectValueCents = 1_800_000;
  return {
    depositCents: Math.round(projectValueCents * DEPOSIT_FRACTION),
    projectValueCents,
    fraction: DEPOSIT_FRACTION,
    anchored: false,
  };
}

/**
 * The home design-fee model — mirrors `buildDesign` in `lib/design.ts`. The
 * "deposit" for a home is the design fee that funds the permit set: a flat
 * consultation plus a sqft-scaled design deposit.
 */
export interface HomePricing {
  consultationCents: number;
  designDepositCents: number;
  totalCents: number;
}

/** Derive the home design-fee pricing from the parsed program. */
export function homePricing(parsed: ParsedRequirements | null): HomePricing {
  const sqft = parsed && Number.isFinite(parsed.sqft) ? parsed.sqft : 2400;
  // Mirrors lib/design.ts: $2.90/sqft rounded to the nearest $250.
  const designDepositDollars = Math.round((sqft * 2.9) / 250) * 250;
  const consultationCents = 85_000;
  const designDepositCents = designDepositDollars * 100;
  return {
    consultationCents,
    designDepositCents,
    totalCents: consultationCents + designDepositCents,
  };
}

/** Format a whole-cent figure as a rounded USD string, e.g. `$12,400`. */
export function formatUsdCents(cents: number): string {
  const dollars = Math.round(cents / 100);
  return `$${dollars.toLocaleString("en-US")}`;
}
