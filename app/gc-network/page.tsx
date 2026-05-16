import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/v2/SectionPlaceholder";

export const metadata: Metadata = {
  title: "GC network",
};

export default function GcNetworkPage() {
  return (
    <SectionPlaceholder
      section="v2.0 · Section 7.2"
      title="Join the GC network"
      blurb="General contractors apply to receive matched client introductions. Scaffolded; build tracked in docs/v2-roadmap.md."
    />
  );
}
