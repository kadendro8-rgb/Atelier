import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/v2/SectionPlaceholder";

export const metadata: Metadata = {
  title: "Stamp partner dashboard",
};

export default function PartnerDashboardPage() {
  return (
    <SectionPlaceholder
      section="v2.0 · Section 7.1"
      title="Stamp partner dashboard"
      blurb="Licensed architects review incoming projects, stamp sheet sets, and get paid via Stripe Connect (80% architect / 20% Atelier). Scaffolded; build tracked in docs/v2-roadmap.md."
    />
  );
}
