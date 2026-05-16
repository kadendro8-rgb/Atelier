import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/v2/SectionPlaceholder";

export const metadata: Metadata = {
  title: "Showcase style",
};

export default async function ShowcaseStylePage({
  params,
}: {
  params: Promise<{ style: string }>;
}) {
  const { style } = await params;
  const label = style.replace(/-/g, " ");
  return (
    <SectionPlaceholder
      section="v2.0 · Section 5"
      title={`Showcase — ${label}`}
      blurb="One of ten SEO landing pages, one per home style, with ~800 words of original copy. Scaffolded; build tracked in docs/v2-roadmap.md."
    />
  );
}
