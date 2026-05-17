import type { Metadata } from "next";
import { PortalClient } from "@/components/portal/PortalClient";
import { buildPortalProject } from "@/lib/portal-mock";
import { hasStripe } from "@/lib/env";

export const metadata: Metadata = {
  title: "Client portal · Atelier",
  description: "Review your custom-home design and fund the project.",
  robots: { index: false },
};

export default async function ClientPortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; token: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug, token } = await params;
  const query = await searchParams;
  const project = buildPortalProject(slug, token);

  // Stripe's success_url returns the client here with `?funded=1`.
  const initialFunded = query.funded === "1";

  return (
    <PortalClient
      project={project}
      stripeEnabled={hasStripe}
      initialFunded={initialFunded}
    />
  );
}
