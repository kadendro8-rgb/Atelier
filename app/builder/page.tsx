import type { Metadata } from "next";
import { BuilderWorkspace } from "@/components/builder/BuilderWorkspace";

export const metadata: Metadata = {
  title: "The builder",
  description:
    "Design a custom home in Atelier — brief, floor plan, site, renders, and a client portal that collects the deposit.",
};

export default function BuilderPage() {
  return <BuilderWorkspace />;
}
