import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/v2/SectionPlaceholder";

export const metadata: Metadata = {
  title: "Match with a builder",
};

export default function MatchPage() {
  return (
    <SectionPlaceholder
      section="v2.0 · Section 7.2"
      title="Match with a builder"
      blurb="Clients without a builder answer a short quiz and Atelier surfaces three vetted GCs in their market. Scaffolded; build tracked in docs/v2-roadmap.md."
    />
  );
}
