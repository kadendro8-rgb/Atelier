/**
 * The single, site-wide primary call to action.
 *
 * Framed as the existing keyless free trial — three designs, no card — and
 * pointed straight at the builder, which stays open to everyone. Shared by the
 * nav, the homepage hero, and the final CTA so the trial reads identically
 * everywhere.
 *
 * This lives in its own dependency-free module (no `"use client"`, no data
 * clients) so server components can import it without dragging client-only
 * code into the server build.
 */
export const TRIAL_CTA = {
  href: "/builder",
  label: "Start free — 3 designs, no card",
  /** A shorter form for tight layouts (mobile bar, inline). */
  short: "Start free",
} as const;
