/**
 * Project pricing — derives the design fee, the up-front deposit, and a
 * construction estimate from a home's finished square footage.
 *
 * Pure and deterministic: the builder's publish step calls this to fill the
 * `projects.*_cents` columns, and the client portal renders the result.
 */

/** Design fee, USD per finished square foot. */
const DESIGN_FEE_PER_SQFT = 3;
/** Rough construction estimate, USD per finished square foot. */
const CONSTRUCTION_PER_SQFT = 220;

export type ProjectPricing = {
  /** Atelier design fee, in cents. */
  designFeeCents: number;
  /** Deposit the client pays in-portal to start — the design fee up front. */
  depositCents: number;
  /** Ballpark construction cost, in cents. */
  constructionEstimateCents: number;
};

/**
 * Price a project from its finished square footage. A non-positive or
 * non-finite `sqft` yields a zeroed estimate rather than throwing.
 */
export function priceProject(sqft: number): ProjectPricing {
  const safeSqft = Number.isFinite(sqft) && sqft > 0 ? sqft : 0;

  const designFeeCents = Math.round(safeSqft * DESIGN_FEE_PER_SQFT) * 100;
  const constructionEstimateCents =
    Math.round(safeSqft * CONSTRUCTION_PER_SQFT) * 100;

  return {
    designFeeCents,
    // The client pays the design fee up front to begin the project.
    depositCents: designFeeCents,
    constructionEstimateCents,
  };
}
