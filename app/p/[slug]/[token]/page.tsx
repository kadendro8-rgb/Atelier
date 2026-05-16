import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/v2/SectionPlaceholder";

export const metadata: Metadata = {
  title: "Client portal",
  robots: { index: false },
};

export default async function ClientPortalPage({
  params,
}: {
  params: Promise<{ slug: string; token: string }>;
}) {
  const { slug } = await params;
  return (
    <SectionPlaceholder
      section="v2.0 · Section 4"
      title="Client portal"
      blurb={`Branded portal for "${slug}" — interactive plans, renders, spec, documents, and a Stripe Connect deposit. Scaffolded; build tracked in docs/v2-roadmap.md.`}
    />
  );
}
