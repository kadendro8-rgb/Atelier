/**
 * Hand-written row types for the Atelier Supabase schema.
 *
 * These mirror `supabase/migrations/` exactly. They are intentionally
 * hand-written (rather than generated) so the foundation layer has zero
 * tooling dependency; keep them in sync when migrations change.
 */

import type { SiteMeta } from "@/lib/gis/types";

/** A generic JSON value, used for `jsonb` columns. */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** Roles a profile can hold (see `profiles.role` check constraint). */
export type ProfileRole =
  | "builder"
  | "client"
  | "architect"
  | "admin"
  | "staff";

/** Subscription plans (see `profiles.plan` check constraint). */
export type ProfilePlan = "free" | "solo" | "studio" | "firm";

/** Project lifecycle status (see `projects.status` check constraint). */
export type ProjectStatus =
  | "draft"
  | "review"
  | "funded"
  | "built"
  | "archived";

/** `public.profiles` row. */
export interface ProfileRow {
  id: string;
  role: ProfileRole;
  display_name: string | null;
  company_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  stripe_customer_id: string | null;
  stripe_connect_account_id: string | null;
  plan: ProfilePlan;
  created_at: string;
  updated_at: string;
}

/**
 * The plan-graph stored in `projects.plan_graph`. The plan engine (W3) owns
 * the rich shape; the foundation layer treats it as structured JSON so the
 * schema stays decoupled from the engine's evolving model.
 */
export type PlanGraph = { [key: string]: Json | undefined };

/**
 * The `projects.meta` payload. Worker domains are namespaced as sibling keys:
 * W2 (Site Intelligence) owns `meta.site`; future workers add their own key
 * and never overwrite `site`.
 */
export interface ProjectMeta {
  site?: SiteMeta;
}

/** `public.projects` row. */
export interface ProjectRow {
  id: string;
  owner_id: string;
  client_id: string | null;
  name: string;
  slug: string;
  address: string | null;
  parcel_geojson: Json | null;
  brief: Json | null;
  plan_graph: PlanGraph | null;
  meta: ProjectMeta | null;
  status: ProjectStatus;
  share_token: string | null;
  design_fee_cents: number | null;
  deposit_cents: number | null;
  construction_estimate_cents: number | null;
  created_at: string;
  updated_at: string;
}

/** Columns accepted when creating a project. DB defaults fill the rest. */
export interface ProjectInsert {
  owner_id: string;
  name: string;
  slug: string;
  client_id?: string | null;
  address?: string | null;
  parcel_geojson?: Json | null;
  brief?: Json | null;
  plan_graph?: PlanGraph | null;
  meta?: ProjectMeta | null;
  status?: ProjectStatus;
  design_fee_cents?: number | null;
  deposit_cents?: number | null;
  construction_estimate_cents?: number | null;
}

/** Columns that may be patched on an existing project. */
export type ProjectUpdate = Partial<Omit<ProjectInsert, "owner_id">>;

/** `public.leads` row (email capture, including the reconciled columns). */
export interface LeadRow {
  id: string;
  email: string;
  brief: string;
  source: string | null;
  resume_token: string | null;
  created_at: string;
}

/** Columns accepted when inserting a lead. */
export interface LeadInsert {
  email: string;
  brief?: string;
  source?: string | null;
}
