import type { Metadata } from "next";
import { PortalClient } from "@/components/portal/PortalClient";
import { buildPortalProject, type PortalProject } from "@/lib/portal-mock";
import { toPortalProject } from "@/lib/portal";
import { getProjectByShareToken, getProfile, DbUnavailableError } from "@/lib/db";
import { hasStripe } from "@/lib/env";

export const metadata: Metadata = {
  title: "Client portal · Atelier",
  description: "Review your custom-home design and fund the project.",
  robots: { index: false },
};

/**
 * Resolve the portal view-model for a `/p/{slug}/{token}` link.
 *
 * When Supabase is configured and the link matches a real project, the portal
 * renders that project. Otherwise — Supabase unconfigured, no matching link,
 * or a query error — it degrades to the deterministic demo project so the
 * portal still works keyless.
 */
async function resolvePortal(
  slug: string,
  token: string,
): Promise<{ project: PortalProject; funded: boolean }> {
  try {
    const row = await getProjectByShareToken(slug, token);
    if (!row) {
      return { project: buildPortalProject(slug, token), funded: false };
    }
    const owner = row.owner_id
      ? await getProfile(row.owner_id).catch(() => null)
      : null;
    const client = row.client_id
      ? await getProfile(row.client_id).catch(() => null)
      : null;
    return {
      project: toPortalProject({ project: row, owner, client, token }),
      funded: row.status === "funded",
    };
  } catch (err) {
    if (!(err instanceof DbUnavailableError)) {
      console.error("portal: project lookup failed:", err);
    }
    return { project: buildPortalProject(slug, token), funded: false };
  }
}

export default async function ClientPortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; token: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug, token } = await params;
  const query = await searchParams;
  const { project, funded } = await resolvePortal(slug, token);

  // Funded when the project is already paid, or Stripe's success_url just
  // returned the client here with `?funded=1`.
  const initialFunded = query.funded === "1" || funded;

  return (
    <PortalClient
      project={project}
      stripeEnabled={hasStripe}
      initialFunded={initialFunded}
    />
  );
}
