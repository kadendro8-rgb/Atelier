import type { Metadata } from "next";
import { PortalClient } from "@/components/portal/PortalClient";
import { buildPortalProject } from "@/lib/portal-mock";

export const metadata: Metadata = {
  title: "Client portal · Atelier",
  description: "Review your design and fund the project.",
  robots: { index: false },
};

export default async function ClientPortalPage({
  params,
}: {
  params: Promise<{ slug: string; token: string }>;
}) {
  const { slug, token } = await params;
  const project = buildPortalProject(slug, token);
  return <PortalClient project={project} />;
}
