import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/v2/SectionPlaceholder";

export const metadata: Metadata = {
  title: "Design gallery",
};

export default function GalleryPage() {
  return (
    <SectionPlaceholder
      section="v2.0 · Section 7.3"
      title="Public design gallery"
      blurb="Approved-and-paid projects, opt-in, filterable by style, sqft, region, and budget. Scaffolded; build tracked in docs/v2-roadmap.md."
    />
  );
}
