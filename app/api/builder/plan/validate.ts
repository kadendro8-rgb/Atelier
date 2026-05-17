/**
 * Pure request-body validation for the builder floor-plan persistence route,
 * split out from `route.ts` so it can be unit-tested without spinning up the
 * Next.js runtime.
 */

/** A `PUT` body that passed validation: a project id and a plan-graph object. */
export type ValidPlanPutBody = {
  projectId: string;
  planGraph: Record<string, unknown>;
};

/**
 * Validate an untrusted `PUT` body.
 *
 * Returns the narrowed body on success, or `null` when `projectId` is missing
 * or blank, or `planGraph` is not a plain (non-array, non-null) object — the
 * cases the route answers with HTTP 400.
 */
export function validatePlanPutBody(body: unknown): ValidPlanPutBody | null {
  if (!body || typeof body !== "object") return null;
  const { projectId, planGraph } = body as {
    projectId?: unknown;
    planGraph?: unknown;
  };

  if (typeof projectId !== "string" || projectId.trim().length === 0) {
    return null;
  }
  if (
    typeof planGraph !== "object" ||
    planGraph === null ||
    Array.isArray(planGraph)
  ) {
    return null;
  }

  return { projectId, planGraph: planGraph as Record<string, unknown> };
}
