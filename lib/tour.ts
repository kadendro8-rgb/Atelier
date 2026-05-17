/**
 * Guided-tour model for the builder.
 *
 * The tour is a sequence of coachmarks that spotlight real builder controls.
 * It spans three routes (lot → brief → floor-plan), so each step declares the
 * route it belongs to and the `data-tour` anchor it points at. The active
 * `GuidedTour` instance only renders the steps whose route matches the current
 * page; advancing past a route's last step is what carries the visitor onward.
 *
 * Everything here is keyless and offline-safe — "seen" state lives in
 * localStorage and every read/write is wrapped so storage being unavailable
 * (private mode, disabled) never breaks the flow.
 */

/** The builder routes a tour step can be anchored to. */
export type TourRoute = "lot" | "brief" | "floor-plan";

/** Where the coachmark sits relative to its anchored element. */
export type TourPlacement = "top" | "bottom" | "left" | "right";

/** One coachmark in the guided tour. */
export interface TourStep {
  /** Stable id, also used as the `data-tour` attribute value of the anchor. */
  id: string;
  /** Which builder route this step's anchor lives on. */
  route: TourRoute;
  /** Short, confident heading. */
  title: string;
  /** One or two sentences of plain-language guidance. */
  body: string;
  /** Preferred placement; the component flips it if it would overflow. */
  placement: TourPlacement;
}

/**
 * The full tour, in order. 3–6 steps covering the key builder moments.
 * Keep `id` values in sync with the `data-tour="…"` attributes in the pages.
 */
export const TOUR_STEPS: readonly TourStep[] = [
  {
    id: "project-type",
    route: "lot",
    title: "Pick what you're building",
    body: "Start by choosing the project type. Atelier tailors every later step — the plan, the code checks, the renders — to this choice.",
    placement: "bottom",
  },
  {
    id: "address",
    route: "lot",
    title: "Site it from real mapping data",
    body: "Search an address and Atelier pulls the parcel, terrain, and neighbours from public GIS. No lot yet? Skip it — you can design without one.",
    placement: "bottom",
  },
  {
    id: "brief",
    route: "brief",
    title: "Describe it in plain language",
    body: "Brief the home the way you would a draftsperson — style, size, must-haves. Tap an example to see the shape of a good brief.",
    placement: "bottom",
  },
  {
    id: "generate",
    route: "brief",
    title: "Generate the design",
    body: "One tap turns the brief into a real, code-checked floor plan. This is the moment that used to take a quarter.",
    placement: "top",
  },
  {
    id: "plan",
    route: "floor-plan",
    title: "Review the plan and the code check",
    body: "Switch between 2D and 3D, and read the IRC code check Atelier ran automatically. From here it's renders, pricing, and a client portal.",
    placement: "top",
  },
] as const;

/** localStorage key for the "tour already seen / dismissed" flag. */
const TOUR_SEEN_KEY = "atelier:tourSeen";

/** Whether the visitor has already seen or dismissed the guided tour. */
export function hasTourBeenSeen(): boolean {
  try {
    return window.localStorage.getItem(TOUR_SEEN_KEY) === "1";
  } catch {
    // Storage unavailable — treat as seen so we never nag in a broken env.
    return true;
  }
}

/** Mark the guided tour as seen so it shows only once. Best-effort. */
export function markTourSeen(): void {
  try {
    window.localStorage.setItem(TOUR_SEEN_KEY, "1");
  } catch {
    // Persisting is best-effort — a re-show next visit is acceptable.
  }
}

/** Clear the "seen" flag — used by the in-builder "Replay tour" affordance. */
export function resetTourSeen(): void {
  try {
    window.localStorage.removeItem(TOUR_SEEN_KEY);
  } catch {
    // Best-effort — nothing to recover if storage is unavailable.
  }
}
