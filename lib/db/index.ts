/**
 * Typed database wrappers built on the service-role Supabase client.
 *
 * Every helper here returns a fully typed row (or null), so callers get
 * autocomplete and compile-time errors instead of `any`. The service-role
 * client bypasses RLS — import these only from server code (route handlers,
 * server actions). When Supabase is not configured, `getSupabaseAdmin()`
 * returns null; wrappers surface that as a thrown `DbUnavailableError` so
 * callers can decide how to degrade.
 */
import { getSupabaseAdmin } from "@/lib/supabase";
import type {
  GmvEventInsert,
  GmvEventRow,
  LeadRow,
  PlanGraph,
  ProjectInsert,
  ProjectRow,
  ProjectUpdate,
} from "@/lib/db/types";

export * from "@/lib/db/types";

/** Thrown when a DB wrapper is called but Supabase is not configured. */
export class DbUnavailableError extends Error {
  constructor() {
    super("Supabase is not configured (missing URL or service-role key).");
    this.name = "DbUnavailableError";
  }
}

/** Thrown when an underlying Supabase query fails. */
export class DbQueryError extends Error {
  constructor(operation: string, detail: string) {
    super(`Database operation '${operation}' failed: ${detail}`);
    this.name = "DbQueryError";
  }
}

/** Returns the admin client or throws `DbUnavailableError`. */
function requireClient() {
  const client = getSupabaseAdmin();
  if (!client) throw new DbUnavailableError();
  return client;
}

/**
 * Fetch a single project by id. Returns null when no row matches.
 * @throws DbQueryError on an unexpected query failure.
 */
export async function getProject(id: string): Promise<ProjectRow | null> {
  const { data, error } = await requireClient()
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new DbQueryError("getProject", error.message);
  return (data as ProjectRow | null) ?? null;
}

/**
 * Insert a new project and return the created row.
 * @throws DbQueryError on an unexpected query failure.
 */
export async function createProject(
  data: ProjectInsert,
): Promise<ProjectRow> {
  const { data: row, error } = await requireClient()
    .from("projects")
    .insert(data)
    .select("*")
    .single();

  if (error) throw new DbQueryError("createProject", error.message);
  return row as ProjectRow;
}

/**
 * Patch an existing project and return the updated row.
 * @throws DbQueryError on an unexpected query failure.
 */
export async function updateProject(
  id: string,
  patch: ProjectUpdate,
): Promise<ProjectRow> {
  const { data: row, error } = await requireClient()
    .from("projects")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new DbQueryError("updateProject", error.message);
  return row as ProjectRow;
}

/**
 * Persist an email-capture lead (the /builder "save brief" flow) into the
 * reconciled `leads` table.
 * @param email  Lead email address.
 * @param brief  The brief text (may be empty).
 * @param source Optional origin tag (e.g. "builder", "showcase").
 * @throws DbQueryError on an unexpected query failure.
 */
export async function saveBrief(
  email: string,
  brief: string,
  source?: string,
): Promise<LeadRow> {
  const { data: row, error } = await requireClient()
    .from("leads")
    .insert({ email, brief, source: source ?? null })
    .select("*")
    .single();

  if (error) throw new DbQueryError("saveBrief", error.message);
  return row as LeadRow;
}

/**
 * Read the stored plan-graph for a project. Returns null when the project has
 * no plan-graph yet (or does not exist).
 * @throws DbQueryError on an unexpected query failure.
 */
export async function getPlanGraph(
  projectId: string,
): Promise<PlanGraph | null> {
  const { data, error } = await requireClient()
    .from("projects")
    .select("plan_graph")
    .eq("id", projectId)
    .maybeSingle();

  if (error) throw new DbQueryError("getPlanGraph", error.message);
  const row = data as Pick<ProjectRow, "plan_graph"> | null;
  return row?.plan_graph ?? null;
}

/**
 * Write the plan-graph for a project and return the updated row.
 * @throws DbQueryError on an unexpected query failure.
 */
export async function savePlanGraph(
  projectId: string,
  graph: PlanGraph,
): Promise<ProjectRow> {
  return updateProject(projectId, { plan_graph: graph });
}

/**
 * Record a GMV (gross-merchandise-value) event for revenue tracking — e.g. a
 * paid deposit, a design fee, a stamp fee. Inserts into `gmv_events` and
 * returns the created row.
 * @throws DbUnavailableError when Supabase is not configured.
 * @throws DbQueryError on an unexpected query failure.
 */
export async function logGmvEvent(
  event: GmvEventInsert,
): Promise<GmvEventRow> {
  const { data: row, error } = await requireClient()
    .from("gmv_events")
    .insert(event)
    .select("*")
    .single();

  if (error) throw new DbQueryError("logGmvEvent", error.message);
  return row as GmvEventRow;
}
